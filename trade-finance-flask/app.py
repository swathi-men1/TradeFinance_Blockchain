import os
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, render_template, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import jwt
import shutil

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///trade_finance.db')
if app.config['SQLALCHEMY_DATABASE_URI'].startswith('postgres://'):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['QUARANTINE_FOLDER'] = 'quarantine'

# Create folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['QUARANTINE_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # corporate, bank, auditor, admin
    risk_score = db.Column(db.Float, default=0.0)
    risk_level = db.Column(db.String(50), default='LOW')
    risk_reason = db.Column(db.Text)
    risk_updated_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Document(db.Model):
    __tablename__ = 'documents'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_hash = db.Column(db.String(64), nullable=False)
    file_size = db.Column(db.Integer)
    uploaded_by = db.Column(db.String(255), db.ForeignKey('users.email'))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='PENDING')  # PENDING, ACCEPTED, REJECTED
    is_deleted = db.Column(db.Boolean, default=False)
    deleted_by = db.Column(db.String(255))
    deleted_at = db.Column(db.DateTime)
    delete_reason = db.Column(db.Text)


class LedgerEntry(db.Model):
    __tablename__ = 'ledger_entries'
    id = db.Column(db.Integer, primary_key=True)
    document_id = db.Column(db.Integer, db.ForeignKey('documents.id'))
    action = db.Column(db.String(100), nullable=False)
    actor = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    event_metadata = db.Column(db.Text)


class Transaction(db.Model):
    __tablename__ = 'transactions'
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(255), db.ForeignKey('users.email'))
    amount = db.Column(db.Float)
    status = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# JWT Token Functions
def create_token(email, role):
    payload = {
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.filter_by(email=data['email']).first()
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator


# Utility Functions
def calculate_file_hash(filepath):
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def create_ledger_entry(document_id, action, actor, event_metadata=""):
    entry = LedgerEntry(
        document_id=document_id,
        action=action,
        actor=actor,
        event_metadata=event_metadata
    )
    db.session.add(entry)
    db.session.commit()


def calculate_risk_score(user):
    """Calculate rule-based risk score (0-100)"""
    score = 0
    reasons = []

    # 1. Document Integrity (40%)
    docs = Document.query.filter_by(uploaded_by=user.email, is_deleted=False).all()
    if docs:
        tampered_count = 0
        for doc in docs:
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], doc.filename)
            if os.path.exists(filepath):
                current_hash = calculate_file_hash(filepath)
                if current_hash != doc.file_hash:
                    tampered_count += 1
        
        if tampered_count > 0:
            integrity_score = min(40, (tampered_count / len(docs)) * 40)
            score += integrity_score
            reasons.append(f"{tampered_count} tampered documents detected")
    
    # 2. Ledger Activity (30%)
    ledger_entries = LedgerEntry.query.filter_by(actor=user.email).all()
    delete_count = sum(1 for entry in ledger_entries if 'delete' in entry.action.lower())
    if delete_count > 5:
        activity_score = min(30, (delete_count - 5) * 3)
        score += activity_score
        reasons.append(f"High deletion activity: {delete_count} deletions")
    
    # 3. Transaction Behavior (20%)
    transactions = Transaction.query.filter_by(user_email=user.email).all()
    rejected_txns = sum(1 for txn in transactions if txn.status == 'REJECTED')
    if transactions and rejected_txns > 0:
        txn_score = min(20, (rejected_txns / len(transactions)) * 20)
        score += txn_score
        reasons.append(f"{rejected_txns} rejected transactions")
    
    # 4. External Country Risk (10%)
    # Placeholder - would integrate with external risk API
    score += 5  # Default baseline risk
    
    # Determine risk level
    if score <= 30:
        risk_level = 'LOW'
    elif score <= 70:
        risk_level = 'MEDIUM'
    else:
        risk_level = 'HIGH'
    
    user.risk_score = round(score, 2)
    user.risk_level = risk_level
    user.risk_reason = '; '.join(reasons) if reasons else 'Normal activity'
    user.risk_updated_at = datetime.utcnow()
    db.session.commit()
    
    return user.risk_score


# Routes - Authentication
@app.route('/')
def index():
    return render_template('login.html')


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        email=data['email'],
        role=data.get('role', 'corporate')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = create_token(user.email, user.role)
    return jsonify({
        'token': token,
        'role': user.role,
        'email': user.email
    })


# Routes - Documents
@app.route('/upload-document', methods=['POST'])
@token_required
@role_required('corporate')
def upload_document(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Secure filename
    original_filename = secure_filename(file.filename)
    filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{original_filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    # Save file
    file.save(filepath)
    
    # Calculate hash
    file_hash = calculate_file_hash(filepath)
    
    # Check for duplicates
    existing = Document.query.filter_by(file_hash=file_hash, is_deleted=False).first()
    if existing:
        os.remove(filepath)
        return jsonify({'error': 'Duplicate document detected'}), 400
    
    # Create document record
    document = Document(
        filename=filename,
        original_filename=original_filename,
        file_hash=file_hash,
        file_size=os.path.getsize(filepath),
        uploaded_by=current_user.email,
        status='PENDING'
    )
    db.session.add(document)
    db.session.commit()
    
    # Create ledger entry
    create_ledger_entry(
        document.id,
        'UPLOAD',
        current_user.email,
        f"Uploaded {original_filename}"
    )
    
    # Recalculate risk score
    calculate_risk_score(current_user)
    
    return jsonify({
        'message': 'Document uploaded successfully',
        'document_id': document.id
    }), 201


@app.route('/my-documents', methods=['GET'])
@token_required
@role_required('corporate')
def my_documents(current_user):
    docs = Document.query.filter_by(
        uploaded_by=current_user.email,
        is_deleted=False
    ).all()
    
    result = []
    for doc in docs:
        # Verify integrity
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], doc.filename)
        is_tampered = False
        if os.path.exists(filepath):
            current_hash = calculate_file_hash(filepath)
            is_tampered = current_hash != doc.file_hash
        
        result.append({
            'id': doc.id,
            'filename': doc.original_filename,
            'upload_date': doc.upload_date.isoformat(),
            'status': doc.status,
            'is_tampered': is_tampered,
            'file_size': doc.file_size
        })
    
    return jsonify(result)


@app.route('/documents', methods=['GET'])
@token_required
@role_required('bank', 'auditor', 'admin')
def all_documents(current_user):
    if current_user.role == 'admin':
        docs = Document.query.all()
    else:
        docs = Document.query.filter_by(is_deleted=False).all()
    
    result = []
    for doc in docs:
        filepath = os.path.join(
            app.config['QUARANTINE_FOLDER'] if doc.is_deleted else app.config['UPLOAD_FOLDER'],
            doc.filename
        )
        is_tampered = False
        if os.path.exists(filepath):
            current_hash = calculate_file_hash(filepath)
            is_tampered = current_hash != doc.file_hash
        
        result.append({
            'id': doc.id,
            'filename': doc.original_filename,
            'uploaded_by': doc.uploaded_by,
            'upload_date': doc.upload_date.isoformat(),
            'status': doc.status,
            'is_deleted': doc.is_deleted,
            'is_tampered': is_tampered,
            'file_size': doc.file_size
        })
    
    return jsonify(result)


@app.route('/documents/<int:doc_id>/status', methods=['PUT'])
@token_required
@role_required('bank')
def update_status(current_user, doc_id):
    data = request.get_json()
    document = Document.query.get_or_404(doc_id)
    
    old_status = document.status
    document.status = data['status']
    db.session.commit()
    
    create_ledger_entry(
        doc_id,
        'STATUS_UPDATE',
        current_user.email,
        f"Changed status from {old_status} to {data['status']}"
    )
    
    # Recalculate uploader's risk score
    uploader = User.query.filter_by(email=document.uploaded_by).first()
    if uploader:
        calculate_risk_score(uploader)
    
    return jsonify({'message': 'Status updated successfully'})


@app.route('/documents/<int:doc_id>', methods=['DELETE'])
@token_required
def delete_document(current_user, doc_id):
    document = Document.query.get_or_404(doc_id)
    
    # Check permissions
    if current_user.role == 'corporate' and document.uploaded_by != current_user.email:
        return jsonify({'error': 'Cannot delete other users documents'}), 403
    
    if current_user.role not in ['corporate', 'bank', 'admin']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    # Soft delete
    source = os.path.join(app.config['UPLOAD_FOLDER'], document.filename)
    dest = os.path.join(app.config['QUARANTINE_FOLDER'], document.filename)
    
    if os.path.exists(source):
        shutil.move(source, dest)
    
    document.is_deleted = True
    document.deleted_by = current_user.email
    document.deleted_at = datetime.utcnow()
    document.delete_reason = request.get_json().get('reason', 'No reason provided')
    db.session.commit()
    
    create_ledger_entry(
        doc_id,
        'DELETE',
        current_user.email,
        f"Soft deleted: {document.delete_reason}"
    )
    
    # Recalculate risk score
    if document.uploaded_by:
        uploader = User.query.filter_by(email=document.uploaded_by).first()
        if uploader:
            calculate_risk_score(uploader)
    
    return jsonify({'message': 'Document deleted successfully'})


@app.route('/documents/<int:doc_id>/restore', methods=['PUT'])
@token_required
@role_required('bank', 'admin')
def restore_document(current_user, doc_id):
    document = Document.query.get_or_404(doc_id)
    
    if not document.is_deleted:
        return jsonify({'error': 'Document is not deleted'}), 400
    
    # Restore file
    source = os.path.join(app.config['QUARANTINE_FOLDER'], document.filename)
    dest = os.path.join(app.config['UPLOAD_FOLDER'], document.filename)
    
    if os.path.exists(source):
        shutil.move(source, dest)
    
    document.is_deleted = False
    document.deleted_by = None
    document.deleted_at = None
    document.delete_reason = None
    db.session.commit()
    
    create_ledger_entry(
        doc_id,
        'RESTORE',
        current_user.email,
        "Document restored from quarantine"
    )
    
    return jsonify({'message': 'Document restored successfully'})


@app.route('/documents/<int:doc_id>/preview', methods=['GET'])
def preview_document(doc_id):
    document = Document.query.get_or_404(doc_id)
    
    folder = app.config['QUARANTINE_FOLDER'] if document.is_deleted else app.config['UPLOAD_FOLDER']
    filepath = os.path.join(folder, document.filename)
    
    if not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(filepath, download_name=document.original_filename)


@app.route('/documents/<int:doc_id>/ledger', methods=['GET'])
@token_required
def get_ledger(current_user, doc_id):
    entries = LedgerEntry.query.filter_by(document_id=doc_id).order_by(LedgerEntry.timestamp.desc()).all()
    
    result = [{
        'action': entry.action,
        'actor': entry.actor,
        'timestamp': entry.timestamp.isoformat(),
        'metadata': entry.event_metadata
    } for entry in entries]
    
    return jsonify(result)


@app.route('/users/<email>/risk-score', methods=['GET'])
@token_required
def get_risk_score(current_user, email):
    # Users can only view their own risk score, except admin/bank
    if current_user.email != email and current_user.role not in ['admin', 'bank']:
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    user = User.query.filter_by(email=email).first_or_404()
    
    # Recalculate risk score
    calculate_risk_score(user)
    
    return jsonify({
        'email': user.email,
        'risk_score': user.risk_score,
        'risk_level': user.risk_level,
        'risk_reason': user.risk_reason,
        'risk_updated_at': user.risk_updated_at.isoformat() if user.risk_updated_at else None
    })


# HTML Pages
@app.route('/corporate')
def corporate_page():
    return render_template('corporate.html')


@app.route('/bank')
def bank_page():
    return render_template('bank.html')


@app.route('/auditor')
def auditor_page():
    return render_template('auditor.html')


@app.route('/admin')
def admin_page():
    return render_template('admin.html')


# Initialize database
with app.app_context():
    db.create_all()
    
    # Create default admin user if not exists
    if not User.query.filter_by(email='admin@trade.com').first():
        admin = User(email='admin@trade.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

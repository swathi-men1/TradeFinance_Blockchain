import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    bank = "bank"
    corporate = "corporate"
    auditor = "auditor"

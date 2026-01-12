
import API from "../api/api";
import { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({name:"",email:"",password:"",role:"corporate",org_name:""});

  const register = async () => {
    await API.post("/auth/register", form);
    alert("Registered");
    window.location.href = "/";
  };

  return (
    <div>
      <h2>Register</h2>
      {Object.keys(form).map(k => (
        <input key={k} placeholder={k} onChange={e=>setForm({...form,[k]:e.target.value})} />
      ))}
      <button onClick={register}>Register</button>
    </div>
  );
}

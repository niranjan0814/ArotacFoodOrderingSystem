import React, { useState } from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import Navbar from "../../components/Navbar/Navbar.jsx";
import "./ContactUs.css";
import { assets } from "../../assets/assets.js";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Field-level validators
  const validators = {
    name: (val) => (!val.trim() ? "Name is required." : ""),
    email: (val) => {
      if (!val) return "Email is required.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
        ? ""
        : "Email is invalid.";
    },
    phone: (val) => {
      const digits = val.replace(/\s+/g, "");
      if (!digits) return "Phone number is required.";
      return /^\+?[0-9]{7,15}$/.test(digits)
        ? ""
        : "Phone number is invalid.";
    },
    address: (val) => (!val.trim() ? "Address is required." : ""),
    message: (val) => (!val.trim() ? "Message cannot be empty." : ""),
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "");
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 3));
    if (digits.length >= 4) parts.push(digits.slice(3, 6));
    if (digits.length >= 7) parts.push(digits.slice(6, 10));
    return parts.join(" ");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "phone") {
      newValue = formatPhone(value);
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: validators[name](newValue) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Run all validators
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validators[key](formData[key]);
      if (error) newErrors[key] = error;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    try {
      // Send form data to backend
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Backend Response:', data);

      if (response.ok && data.success) {
        console.log('Submitted:', formData);
        setFormData({ name: "", email: "", phone: "", address: "", message: "" });
        setErrors({});
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to submit contact form');
      }
    } catch (err) {
      console.error('Contact Form Error:', err);
      setErrors({ form: err.message });
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", phone: "", address: "", message: "" });
    setErrors({});
  };

  return (
    <>
      <Navbar />
      <div className="contact-page">
        <div className="contact-form">
          <h2>Contact Us</h2>
          <form onSubmit={handleSubmit} noValidate>
            {[
              { field: "name", type: "text" },
              { field: "email", type: "email" },
              { field: "phone", type: "tel" },
              { field: "address", type: "text" },
            ].map(({ field, type }) => (
              <div className="form-group" key={field}>
                <label htmlFor={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={field}
                  name={field}
                  type={type}
                  value={formData[field]}
                  onChange={handleChange}
                  className={errors[field] ? "input-error" : ""}
                />
                {errors[field] && <p className="error-text">{errors[field]}</p>}
              </div>
            ))}

            <div className="form-group" key="message">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="4"
                value={formData.message}
                onChange={handleChange}
                className={errors["message"] ? "input-error" : ""}
              />
              {errors["message"] && <p className="error-text">{errors["message"]}</p>}
            </div>

            {errors.form && <p className="error-text">{errors.form}</p>}

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button type="submit" className="btn-send">
                Send
              </button>
            </div>
            {showSuccess && <p className="success-text">Submission successful!</p>}
          </form>

          <div className="social-icons">
            <a href="#" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="#" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        <div className="contact-image">
          <img src={assets.cons} alt="Customer Support" />
        </div>
      </div>
    </>
  );
};

export default ContactUs;
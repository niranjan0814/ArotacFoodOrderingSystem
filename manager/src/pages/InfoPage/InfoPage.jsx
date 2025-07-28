import React from "react";
import "./InfoPage.css"; 
const InfoPage = () => {
  return (
    <div className="info-page">
      <h1 className="info-page-title">Offer Information</h1>
      <p className="info-page-subtitle">
        This page provides detailed information about the different types of
        offers, their components, and the rules you need to follow when creating
        or editing an offer.
      </p>

      <nav className="info-page-nav">
        <a href="#offer-types" className="nav-link">1. Offer Types</a>
        <a href="#rules" className="nav-link">2. Rules and Validations</a>
        <a href="#examples" className="nav-link">3. Examples</a>
        <a href="#faqs" className="nav-link">4. FAQs</a>
        <a href="#contact" className="nav-link">5. Contact Support</a>
      </nav>

      <section id="offer-types" className="info-section">
        <h2 className="info-section-title">1. Offer Types</h2>
        <div className="offer-type">
          <h3 className="offer-type-title">a. Delivery Offer</h3>
          <p className="offer-type-description">
            <strong>Purpose:</strong> Discounts or benefits related to delivery
            orders.
          </p>
          <ul className="offer-type-components">
            <li>
              <strong>Delivery Offer Type:</strong> Choose from:
              <ul>
                <li>Free Delivery: No delivery charges.</li>
                <li>Discount Off: A fixed discount on the total order.</li>
                <li>Percentage Off: A percentage discount on the total order.</li>
              </ul>
            </li>
            <li>
              <strong>Eligibility:</strong> Choose who is eligible for this
              offer:
              <ul>
                <li>Order More Than: Applies to orders above a certain amount.</li>
                <li>First Order: Applies only to the customer's first order.</li>
              </ul>
            </li>
            <li>
              <strong>Discount Value:</strong> The amount or percentage of the
              discount.
            </li>
            <li>
              <strong>Minimum Order Amount:</strong> The minimum order value
              required to avail the offer.
            </li>
          </ul>
        </div>

        <div className="offer-type">
          <h3 className="offer-type-title">b. Combo Offer</h3>
          <p className="offer-type-description">
            <strong>Purpose:</strong> Discounts or special pricing for a
            combination of items.
          </p>
          <ul className="offer-type-components">
            <li>
              <strong>Combo Items:</strong> Select the items that will be part
              of the combo.
            </li>
            <li>
              <strong>Combo Price:</strong> The total price for the selected
              combo items.
            </li>
            <li>
              <strong>Customization Allowed:</strong> Whether customers can
              customize the combo items.
            </li>
          </ul>
        </div>

        <div className="offer-type">
          <h3 className="offer-type-title">c. Festive Offer</h3>
          <p className="offer-type-description">
            <strong>Purpose:</strong> Special discounts or benefits during
            festivals or special occasions.
          </p>
          <ul className="offer-type-components">
            <li>
              <strong>Festival Name:</strong> Name of the festival or occasion.
            </li>
            <li>
              <strong>Eligibility:</strong> Choose who is eligible for this
              offer:
              <ul>
                <li>Order More Than: Applies to orders above a certain amount.</li>
              </ul>
            </li>
            <li>
              <strong>Discount Value:</strong> The amount or percentage of the
              discount.
            </li>
            <li>
              <strong>Minimum Order Amount:</strong> The minimum order value
              required to avail the offer.
            </li>
          </ul>
        </div>
      </section>

      <section id="rules" className="info-section">
        <h2 className="info-section-title">2. Rules and Validations</h2>
        <ul className="rules-list">
          <li>
            <strong>Name:</strong>
            <ul>
              <li>Required: You must provide a name for the offer.</li>
              <li>Max Length: The name cannot exceed 50 characters.</li>
            </ul>
          </li>
          <li>
            <strong>Description:</strong>
            <ul>
              <li>Required: You must provide a description for the offer.</li>
              <li>Max Length: The description cannot exceed 150 characters.</li>
            </ul>
          </li>
          <li>
            <strong>Dates:</strong>
            <ul>
              <li>
                Start Date:
                <ul>
                  <li>Required: You must provide a start date.</li>
                  <li>Rule: The start date must be today or a future date.</li>
                </ul>
              </li>
              <li>
                End Date:
                <ul>
                  <li>Required: You must provide an end date.</li>
                  <li>Rule: The end date must be after the start date.</li>
                </ul>
              </li>
            </ul>
          </li>
          <li>
            <strong>Discount Value:</strong>
            <ul>
              <li>
                Percentage Off: The discount value must be less than or equal to
                100%.
              </li>
              <li>
                Fixed Amount Off: The discount value must be greater than 0.
              </li>
            </ul>
          </li>
          <li>
            <strong>Combo Price:</strong>
            <ul>
              <li>Rule: The combo price must be greater than 0.</li>
            </ul>
          </li>
          <li>
            <strong>Image:</strong>
            <ul>
              <li>File Type: Only JPG and PNG files are allowed.</li>
              <li>File Size: The file size must be less than 5MB.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section id="examples" className="info-section">
        <h2 className="info-section-title">3. Examples</h2>
        <div className="example">
          <h3 className="example-title">Example 1: Delivery Offer</h3>
          <ul className="example-details">
            <li>
              <strong>Name:</strong> Free Delivery for Orders Above Rs. 5000
            </li>
            <li>
              <strong>Description:</strong> Get free delivery on orders above Rs. 5000.
            </li>
            <li>
              <strong>Start Date:</strong> 2023-10-01
            </li>
            <li>
              <strong>End Date:</strong> 2023-10-31
            </li>
            <li>
              <strong>Delivery Offer Type:</strong> Free Delivery
            </li>
            <li>
              <strong>Eligibility:</strong> Order More Than Rs. 5000
            </li>
          </ul>
        </div>

        <div className="example">
          <h3 className="example-title">Example 2: Combo Offer</h3>
          <ul className="example-details">
            <li>
              <strong>Name:</strong> Plain dosa and Cola Combo
            </li>
            <li>
              <strong>Description:</strong> Enjoy a plain dosa and cola combo at a
              discounted price.
            </li>
            <li>
              <strong>Start Date:</strong> 2023-10-01
            </li>
            <li>
              <strong>End Date:</strong> 2023-10-31
            </li>
            <li>
              <strong>Combo Items:</strong> Plain dosa, Cola
            </li>
            <li>
              <strong>Combo Price:</strong> Rs. 750
            </li>
          </ul>
        </div>

        <div className="example">
          <h3 className="example-title">Example 3: Festive Offer</h3>
          <ul className="example-details">
            <li>
              <strong>Name:</strong> Diwali Special Discount
            </li>
            <li>
              <strong>Description:</strong> Get 20% off on all orders during
              Diwali.
            </li>
            <li>
              <strong>Start Date:</strong> 2023-10-20
            </li>
            <li>
              <strong>End Date:</strong> 2023-10-25
            </li>
            <li>
              <strong>Festival Name:</strong> Diwali
            </li>
            <li>
              <strong>Eligibility:</strong> Order More Than Rs. 6000
            </li>
            <li>
              <strong>Discount Value:</strong> 20%
            </li>
          </ul>
        </div>
      </section>

      <section id="faqs" className="info-section">
        <h2 className="info-section-title">4. Answer to your frequent questions</h2>
        <div className="faq">
          <h3 className="faq-question">
            Q1. Can I edit an offer after creating it?
          </h3>
          <p className="faq-answer">
            Yes, you can edit an offer at any time. Just click "Edit" button
            and make the necessary changes in the form.
          </p>
        </div>
        <div className="faq">
          <h3 className="faq-question">
            Q2. What happens if I enter an invalid date?
          </h3>
          <p className="faq-answer">
            The form will show an error message if the start date is in the past
            or if the end date is before the start date.
          </p>
        </div>
        <div className="faq">
          <h3 className="faq-question">
            Q3. Can I upload multiple images for an offer?
          </h3>
          <p className="faq-answer">
            No, you can only upload one image per offer.
          </p>
        </div>
        <div className="faq">
          <h3 className="faq-question">
            Q4. What is the maximum discount I can offer?
          </h3>
          <p className="faq-answer">
            For percentage discounts, the maximum discount is 100%. For fixed
            amount discounts, there is no maximum limit, but the discount must be
            greater than 0.
          </p>
        </div>
      </section>

     
      <section id="contact" className="info-section">
        <h2 className="info-section-title">5. Contact Support</h2>
        <p className="contact-support-text">
          If you have any questions or need help, please contact the support
          team:
        </p>
        <ul className="contact-details">
          <li>
            <strong>Email:</strong> arotac@gmail.com
          </li>
          <li>
            <strong>Phone:</strong> +94 74 1234 795
          </li>
        </ul>
      </section>
    </div>
  );
};

export default InfoPage;
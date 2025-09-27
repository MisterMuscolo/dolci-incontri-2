import React, { useState } from 'react';

const PremiumListingForm = () => {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    city: '',
    phone: '',
    isPremium: false,
    zone: '',
    age: '',
    email: '',
    contactPreference: 'both',
    contactWhatsapp: false,
    ethnicity: '',
    nationality: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <form>
      <div>
        <label htmlFor="ethnicity">Tipo seno:</label>
        <select id="ethnicity" name="ethnicity" onChange={handleChange} value={formData.ethnicity}>
          <option value="">Seleziona</option>
          <option value="Naturale">Naturale</option>
          <option value="Modificato">Modificato</option>
        </select>
      </div>
      <div>
        <label htmlFor="nationality">Nazionalità:</label>
        <input type="text" id="nationality" name="nationality" onChange={handleChange} value={formData.nationality} />
      </div>
      {/* Altri campi del modulo */}
    </form>
  );
};

export default PremiumListingForm;
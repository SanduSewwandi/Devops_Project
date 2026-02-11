import React, { useState, useEffect } from "react";
import "./AddPlant.css";

const AddPlant = ({ onClose, onSave, initialData, isEditing, isLocalStorage = false }) => {
  const [formData, setFormData] = useState({
    plantName: "",
    description: "",
    price: "0.00",
    category: "",
    rating: "0",
    stockQuantity: "10",
    popular: false,
    care: { water: "", light: "", difficulty: "" },
  });

  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://54.234.237.10:5000";

  useEffect(() => {
    if (initialData && isEditing) {
      const plantName = initialData.plantName || initialData.name || "";
      setFormData({
        plantName: plantName,
        description: initialData.description || "",
        price: initialData.price || "0.00",
        category: initialData.category || "",
        rating: initialData.rating || "0",
        stockQuantity: initialData.stockQuantity || initialData.stock || "10",
        popular: initialData.isPopular || initialData.popular || false,
        care: {
          water: initialData.wateringSchedule || initialData.care?.water || "",
          light: initialData.lightRequirements || initialData.care?.light || "",
          difficulty: initialData.careDifficulty || initialData.care?.difficulty || ""
        }
      });
    }
  }, [initialData, isEditing]);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    if (["wateringSchedule", "lightRequirements", "careDifficulty"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        care: {
          ...prev.care,
          water: name === "wateringSchedule" ? value : prev.care.water,
          light: name === "lightRequirements" ? value : prev.care.light,
          difficulty: name === "careDifficulty" ? value : prev.care.difficulty,
        },
      }));
    } else if (name === "popular") {
      setFormData((prev) => ({ ...prev, popular: checked }));
    } else if (name === "rating") {
      const ratingValue = Math.min(5, Math.max(0, parseFloat(value) || 0));
      setFormData((prev) => ({ ...prev, rating: ratingValue.toString() }));
    } else if (name === "stockQuantity") {
      const stockValue = Math.max(0, parseInt(value) || 0);
      setFormData((prev) => ({ ...prev, [name]: stockValue.toString() }));
    } else if (name === "price") {
      const priceValue = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: priceValue.toFixed(2) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setImages(files);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApiSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    if (!token) {
      alert("Access Denied: Please log in as Admin.");
      return;
    }
    
    setUploading(true);

    try {
      const data = new FormData();
      data.append("name", formData.plantName);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("rating", formData.rating);
      data.append("stockQuantity", formData.stockQuantity);
      data.append("popular", formData.popular.toString());
      
      /** * CRITICAL FIX: 
       * Do NOT use JSON.stringify(formData.care). 
       * Your backend controller expects an object, and multipart/form-data 
       * sends strings. We send individual fields that match your schema.
       */
      data.append("wateringSchedule", formData.care.water);
      data.append("lightRequirements", formData.care.light);
      data.append("careDifficulty", formData.care.difficulty);

      // Matches your plantRouter.post name requirements: image1, image2, etc.
      images.forEach((file, idx) => {
        if (file instanceof File) {
          data.append(`image${idx + 1}`, file);
        }
      });

      const url = isEditing && initialData 
        ? `${API_URL}/api/plant/update/${initialData._id || initialData.id}`
        : `${API_URL}/api/plant/add`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Server Error");
      }

      if (onSave) onSave(result.plant);
      alert(`🌱 Plant ${isEditing ? 'updated' : 'added'} successfully!`);
      onClose();
    } catch (err) {
      console.error("Submit Error:", err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="add-plant-overlay">
      <div className="add-plant-container">
        <div className="add-plant-header">
          <h2>{isEditing ? "Edit Plant" : "Add New Plant"}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form className="add-plant-form-content" onSubmit={handleApiSubmit}>
          <div className="form-group">
            <label>Plant Name *</label>
            <input type="text" name="plantName" value={formData.plantName} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (Rs.)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" />
            </div>
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required>
                <option value="">Select Category</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="succulents">Succulents</option>
              </select>
            </div>
          </div>
          
          <div className="care-info-section">
            <h3>Care Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Watering</label>
                <select name="wateringSchedule" value={formData.care.water} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Light</label>
                <select name="lightRequirements" value={formData.care.light} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="full-sun">Full Sun</option>
                  <option value="shade">Shade</option>
                </select>
              </div>
            </div>
          </div>

          <div className="plant-images-section">
            <h3>Images (up to 4)</h3>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={uploading} />
            <div className="images-preview">
              {images.map((img, idx) => (
                <div key={idx} className="image-preview-item">
                  <span>{img.name}</span>
                  <button type="button" onClick={() => removeImage(idx)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="add-plant-footer">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Save Plant"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlant;
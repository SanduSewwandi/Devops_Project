import React, { useState, useEffect } from "react";
import "./AddPlant.css";

const AddPlant = ({ onClose, onSave, initialData, isEditing, isLocalStorage = false }) => {
  // Initialise form data with proper stock handling
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
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Use useEffect to properly initialize form data when initialData changes
  useEffect(() => {
    if (initialData && isEditing) {
      // Handle both frontend (plantName) and backend (name) field names
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

  // handle input change
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    
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
      // Ensure stock is always a valid number
      const stockValue = Math.max(0, parseInt(value) || 0);
      setFormData((prev) => ({ ...prev, [name]: stockValue.toString() }));
    } else if (name === "price") {
      // Ensure price is always a valid number with 2 decimal places
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

  // localStorage save
  const handleLocalStorageSubmit = (e) => {
    e.preventDefault();
    if (!formData.plantName || !formData.description || !formData.category) {
      alert("Please fill all required fields.");
      return;
    }

    const plantData = {
      id: isEditing && initialData ? (initialData.id || initialData._id) : Date.now(),
      plantName: formData.plantName,
      description: formData.description,
      price: formData.price,
      category: formData.category,
      rating: formData.rating,
      stockQuantity: formData.stockQuantity,
      isPopular: formData.popular,
      wateringSchedule: formData.care.water,
      lightRequirements: formData.care.light,
      careDifficulty: formData.care.difficulty,
      images: initialData?.images || [],
      createdAt: isEditing && initialData ? initialData.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingPlants = JSON.parse(localStorage.getItem('plants') || '[]');
    let updatedPlants;
    if (isEditing && initialData) {
      updatedPlants = existingPlants.map(plant =>
        (plant.id || plant._id) === plantData.id ? plantData : plant
      );
    } else {
      updatedPlants = [...existingPlants, plantData];
    }

    localStorage.setItem('plants', JSON.stringify(updatedPlants));
    window.dispatchEvent(new Event('storage'));

    if (onSave) onSave(plantData);
    alert(`🌱 Plant ${isEditing ? 'updated' : 'added'} successfully!`);
    onClose && onClose();
  };

  // API save
  const handleApiSubmit = async (e) => {
    e.preventDefault();
    if (!formData.plantName || !formData.description || !formData.category) {
      alert("Please fill all required fields.");
      return;
    }
    const token = localStorage.getItem("adminToken");
    if (!token) {
      alert("Access Denied: Please log in as Admin to add a plant.");
      return;
    }
    setUploading(true);
    try {
      let response, result;
      if (isEditing && initialData) {
        const plantId = initialData._id || initialData.id;
        const updateData = new FormData();
        updateData.append("name", formData.plantName);
        updateData.append("description", formData.description);
        updateData.append("price", formData.price);
        updateData.append("category", formData.category);
        updateData.append("rating", formData.rating);
        updateData.append("stockQuantity", formData.stockQuantity);
        updateData.append("popular", formData.popular.toString());
        updateData.append("care", JSON.stringify(formData.care));
        images.forEach((file, idx) => {
          if (file instanceof File) {
            updateData.append(`image${idx + 1}`, file);
          }
        });

        response = await fetch(`${API_URL}/api/plant/update/${plantId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: updateData,
        });
        result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.message || "Update failed");
      } else {
        const data = new FormData();
        data.append("name", formData.plantName);
        data.append("description", formData.description);
        data.append("price", formData.price);
        data.append("category", formData.category);
        data.append("rating", formData.rating);
        data.append("stockQuantity", formData.stockQuantity);
        data.append("popular", formData.popular.toString());
        data.append("care", JSON.stringify(formData.care));
        images.forEach((file, idx) => {
          if (file instanceof File) {
            data.append(`image${idx + 1}`, file);
          }
        });
        response = await fetch(`${API_URL}/api/plant/add`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        });
        result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message || "Add failed");
      }

      // Build plant for AdminPage
      const plantForAdminPage = {
        id: result?.plant?._id || result?.plant?.id || initialData?.id || Date.now(),
        plantName: result?.plant?.name || formData.plantName,
        description: result?.plant?.description || formData.description,
        price: result?.plant?.price || formData.price,
        category: result?.plant?.category || formData.category,
        rating: result?.plant?.rating || formData.rating,
        stockQuantity: result?.plant?.stockQuantity || formData.stockQuantity,
        isPopular: result?.plant?.popular || formData.popular,
        wateringSchedule: result?.plant?.care?.water || formData.care.water,
        lightRequirements: result?.plant?.care?.light || formData.care.light,
        careDifficulty: result?.plant?.care?.difficulty || formData.care.difficulty,
        images: result?.plant?.images || initialData?.images || [],
        createdAt: result?.plant?.createdAt || (isEditing && initialData ? initialData.createdAt : new Date().toISOString()),
        updatedAt: result?.plant?.updatedAt || new Date().toISOString()
      };

      if (onSave) onSave(plantForAdminPage);

      // sync localStorage
      const existingPlants = JSON.parse(localStorage.getItem('plants') || '[]');
      let updatedPlants;
      if (isEditing && initialData) {
        updatedPlants = existingPlants.map(plant =>
          (plant.id || plant._id) === (initialData.id || initialData._id)
            ? plantForAdminPage
            : plant
        );
      } else {
        updatedPlants = [...existingPlants, plantForAdminPage];
      }
      localStorage.setItem('plants', JSON.stringify(updatedPlants));
      window.dispatchEvent(new Event('storage'));

      alert(`🌱 Plant ${isEditing ? 'updated' : 'added'} successfully!`);
      onClose && onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = isLocalStorage ? handleLocalStorageSubmit : handleApiSubmit;

  const renderStarRating = () => {
    const rating = parseFloat(formData.rating) || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`star ${i + 1 <= rating ? 'filled' : ''}`}
        onClick={() => setFormData(prev => ({ ...prev, rating: (i + 1).toString() }))}
      >
        ⭐
      </span>
    ));
  };

  return (
    <div className="add-plant-overlay">
      <div className="add-plant-container">
        <div className="add-plant-header">
          <h2>{isEditing ? "Edit Plant" : "Add New Plant"}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form className="add-plant-form-content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Plant Name *</label>
            <input
              type="text"
              name="plantName"
              value={formData.plantName}
              onChange={handleInputChange}
              placeholder="Enter plant name"
              required
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Describe your plant..."
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (Rs.)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                min="0"
                placeholder="10"
                required
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required>
                <option value="">Select Category</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="succulents">Succulents</option>
                <option value="flowering">Flowering</option>
                <option value="herbs">Herbs</option>
                <option value="trees">Trees</option>
              </select>
            </div>
          </div>
          <div className="rating-section">
            <h3>Rating</h3>
            <div className="rating-container">
              <div className="star-rating">{renderStarRating()}</div>
              <div className="rating-input-group">
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                  className="rating-input"
                />
                <span className="rating-label">/ 5</span>
              </div>
            </div>
          </div>
          <div className="care-info-section">
            <h3>Care Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Watering Schedule</label>
                <select name="wateringSchedule" value={formData.care.water} onChange={handleInputChange}>
                  <option value="">Select Schedule</option>
                  <option value="daily">Daily</option>
                  <option value="every-2-days">Every 2 days</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Light Requirements</label>
                <select name="lightRequirements" value={formData.care.light} onChange={handleInputChange}>
                  <option value="">Select Light</option>
                  <option value="full-sun">Full Sun</option>
                  <option value="partial-sun">Partial Sun</option>
                  <option value="shade">Shade</option>
                  <option value="indirect-light">Indirect Light</option>
                  <option value="low-light">Low Light</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Care Difficulty</label>
              <select name="careDifficulty" value={formData.care.difficulty} onChange={handleInputChange}>
                <option value="">Select Difficulty</option>
                <option value="easy">Easy (Beginner)</option>
                <option value="moderate">Moderate</option>
                <option value="difficult">Difficult</option>
                <option value="expert">Expert Only</option>
              </select>
            </div>
          </div>
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="popular"
                checked={formData.popular}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Mark as Popular Plant
            </label>
          </div>
          {!isLocalStorage && (
            <div className="plant-images-section">
              <h3>Images (up to 4)</h3>
              <div className="file-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="file-input"
                  id="plant-images"
                />
                <label htmlFor="plant-images" className="file-upload-label">
                  📷 Choose Images
                </label>
              </div>
              {images.length > 0 && (
                <div className="images-preview">
                  {images.map((img, idx) => (
                    <div key={idx} className="image-preview-item">
                      <span className="image-name">{img.name}</span>
                      <button type="button" onClick={() => removeImage(idx)} className="remove-image">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="add-plant-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={uploading}>
              {uploading ? "Processing..." : (isEditing ? "Update Plant" : "Save Plant")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlant;
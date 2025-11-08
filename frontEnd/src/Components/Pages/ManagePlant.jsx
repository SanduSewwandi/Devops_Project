import React, { useState, useEffect } from 'react';
import './ManagePlant.css';

const ManagePlant = () => {
  const [plants, setPlants] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch plants from backend
  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await fetch('http://localhost:5000/api/plant/manage', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from server:\n' + text);
      }

      if (data.success) {
        setPlants(data.data);
        setFilteredPlants(data.data);
        setError('');
      } else {
        throw new Error(data.message || 'Failed to fetch plants');
      }
    } catch (err) {
      setError(err.message || 'Error loading plants. Please try again later.');
      console.error('Error fetching plants:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters when filter changes
  useEffect(() => {
    let result = plants;

    if (filter === 'low') {
      result = result.filter(plant => plant.stockQuantity > 0 && plant.stockQuantity <= 10);
    } else if (filter === 'in') {
      result = result.filter(plant => plant.stockQuantity > 10);
    } else if (filter === 'out') {
      result = result.filter(plant => plant.stockQuantity === 0);
    }

    setFilteredPlants(result);
  }, [filter, plants]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const getStockStatus = (plant) => {
    if (plant.stockQuantity === 0) return 'out-of-stock';
    if (plant.stockQuantity <= 10) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusText = (plant) => {
    if (plant.stockQuantity === 0) return 'Out of Stock';
    if (plant.stockQuantity <= 10) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <div className="manage-plants-container">
        <div className="loading">Loading plants...</div>
      </div>
    );
  }

  return (
    <div className="manage-plants-container">
      <h1>Manage Plants</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => handleFilterChange('all')}>
            All Plants
          </button>
          <button className={filter === 'in' ? 'active' : ''} onClick={() => handleFilterChange('in')}>
            In Stock
          </button>
          <button className={filter === 'low' ? 'active' : ''} onClick={() => handleFilterChange('low')}>
            Low Stock
          </button>
          <button className={filter === 'out' ? 'active' : ''} onClick={() => handleFilterChange('out')}>
            Out of Stock
          </button>
        </div>
      </div>

      <div className="plants-table-container">
        <table className="plants-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlants.length > 0 ? (
              filteredPlants.map(plant => (
                <tr key={plant._id} className={getStockStatus(plant)}>
                  <td>
                    {plant.images && plant.images.length > 0 ? (
                      <img src={plant.images[0]} alt={plant.name} className="plant-thumbnail" />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td>{plant.name}</td>
                  <td>{plant.category}</td>
                  <td>${plant.price?.toFixed(2)}</td>
                  <td>{plant.stockQuantity}</td>
                  <td>
                    <span className={`status-badge ${getStockStatus(plant)}`}>
                      {getStockStatusText(plant)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  No plants found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="summary">
        <p>Total Plants: {plants.length}</p>
        <p>In Stock: {plants.filter(p => p.stockQuantity > 5).length}</p>
        <p>Low Stock: {plants.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length}</p>
        <p>Out of Stock: {plants.filter(p => p.stockQuantity === 0).length}</p>
      </div>
    </div>
  );
};

export default ManagePlant;

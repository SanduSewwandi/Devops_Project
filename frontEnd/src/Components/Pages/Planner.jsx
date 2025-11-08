
import { useState, useEffect } from "react"
import './Planner.css';
import {
  Plus,
  Check,
  X,
  Calendar,
  Clock,
  Droplets,
  Sun,
  Scissors,
  SproutIcon as Seed,
  Upload,
  Trash2,
  Edit3,
  Star,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

export default function Planner() {
  const [tasks, setTasks] = useState([])
  const [taskInput, setTaskInput] = useState("")
  const [selectedImage, setSelectedImage] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [taskPriority, setTaskPriority] = useState("medium")
  const [taskCategory, setTaskCategory] = useState("general")
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState("all")

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("gardenTasks")
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("gardenTasks", JSON.stringify(tasks))
  }, [tasks])

  const taskCategories = {
    watering: { icon: <Droplets className="planner-category-icon" />, color: "blue" },
    planting: { icon: <Seed className="planner-category-icon" />, color: "green" },
    pruning: { icon: <Scissors className="planner-category-icon" />, color: "orange" },
    harvesting: { icon: <Sun className="planner-category-icon" />, color: "yellow" },
    general: { icon: <Calendar className="planner-category-icon" />, color: "purple" },
  }

  const addTask = () => {
    if (taskInput.trim()) {
      const newTask = {
        id: Date.now(),
        text: taskInput,
        completed: false,
        priority: taskPriority,
        category: taskCategory,
        date: selectedDate.toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      }
      setTasks([...tasks, newTask])
      setTaskInput("")
      setTaskPriority("medium")
      setTaskCategory("general")
    }
  }

  const toggleTask = (id) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const editTask = (id, newText) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, text: newText } : task)))
    setEditingTask(null)
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true
    if (filter === "completed") return task.completed
    if (filter === "pending") return !task.completed
    return task.category === filter
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "planner-priority-high"
      case "medium":
        return "planner-priority-medium"
      case "low":
        return "planner-priority-low"
      default:
        return "planner-priority-medium"
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length
    const pending = total - completed
    const overdue = tasks.filter((task) => !task.completed && new Date(task.date) < new Date()).length

    return { total, completed, pending, overdue }
  }

  const stats = getTaskStats()

  return (
    <div className="planner-workspace">
      {/* Planner Header */}
      <header className="planner-main-header">
        <div className="planner-header-content">
          <div className="planner-title-section">
            <h1 className="planner-main-title">
              <span className="planner-title-icon">🌱</span>
              Garden Planner
            </h1>
            <p className="planner-subtitle">Plan your planting, watering, and harvesting activities</p>
          </div>
          <div className="planner-date-display">
            <Calendar className="planner-date-icon" />
            <span className="planner-current-date">{formatDate(currentDate)}</span>
          </div>
        </div>
      </header>

      {/* Stats Dashboard */}
      <section className="planner-stats-section">
        <div className="planner-stats-grid">
          <div className="planner-stat-card planner-stat-total">
            <div className="planner-stat-icon">
              <Calendar />
            </div>
            <div className="planner-stat-content">
              <div className="planner-stat-number">{stats.total}</div>
              <div className="planner-stat-label">Total Tasks</div>
            </div>
          </div>
          <div className="planner-stat-card planner-stat-completed">
            <div className="planner-stat-icon">
              <CheckCircle2 />
            </div>
            <div className="planner-stat-content">
              <div className="planner-stat-number">{stats.completed}</div>
              <div className="planner-stat-label">Completed</div>
            </div>
          </div>
          <div className="planner-stat-card planner-stat-pending">
            <div className="planner-stat-icon">
              <Clock />
            </div>
            <div className="planner-stat-content">
              <div className="planner-stat-number">{stats.pending}</div>
              <div className="planner-stat-label">Pending</div>
            </div>
          </div>
          <div className="planner-stat-card planner-stat-overdue">
            <div className="planner-stat-icon">
              <AlertCircle />
            </div>
            <div className="planner-stat-content">
              <div className="planner-stat-number">{stats.overdue}</div>
              <div className="planner-stat-label">Overdue</div>
            </div>
          </div>
        </div>
      </section>

      <div className="planner-main-content">
        {/* Calendar Section */}
        <section className="planner-calendar-section">
          <div className="planner-calendar-header">
            <h2 className="planner-section-title">
              <Calendar className="planner-section-icon" />
              Monthly Overview
            </h2>
          </div>
          <div className="planner-calendar-container">
            <img
              src="/src/assets/2025-colorful-annual-calendar-template-printable-design_1017-56669.avif"
              alt="Garden Calendar"
              className="planner-calendar-image"
            />
            <div className="planner-calendar-overlay">
              <p className="planner-calendar-note">
                <span className="planner-note-icon">📅</span>
                Use this space to visualize your monthly gardening schedule
              </p>
            </div>
          </div>
        </section>

        {/* Task Management Section */}
        <section className="planner-task-management">
          <div className="planner-task-header">
            <h2 className="planner-section-title">
              <CheckCircle2 className="planner-section-icon" />
              Your Gardening Tasks
            </h2>
            <div className="planner-task-filters">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="planner-filter-select">
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="watering">Watering</option>
                <option value="planting">Planting</option>
                <option value="pruning">Pruning</option>
                <option value="harvesting">Harvesting</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Add Task Form */}
          <div className="planner-add-task-form">
            <div className="planner-task-input-group">
              <input
                type="text"
                placeholder="Add new gardening task..."
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="planner-task-input"
                onKeyPress={(e) => e.key === "Enter" && addTask()}
              />
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="planner-category-select"
              >
                <option value="general">General</option>
                <option value="watering">Watering</option>
                <option value="planting">Planting</option>
                <option value="pruning">Pruning</option>
                <option value="harvesting">Harvesting</option>
              </select>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="planner-priority-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input
                type="date"
                value={selectedDate.toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="planner-date-input"
              />
              <button onClick={addTask} className="planner-add-button">
                <Plus className="planner-button-icon" />
                Add Task
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="planner-task-list">
            {filteredTasks.length === 0 ? (
              <div className="planner-empty-state">
                <div className="planner-empty-icon">🌿</div>
                <h3>No tasks found</h3>
                <p>Add your first gardening task to get started!</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`planner-task-item ${task.completed ? "planner-task-completed" : ""} ${getPriorityColor(
                    task.priority,
                  )}`}
                >
                  <div className="planner-task-main">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`planner-task-checkbox ${task.completed ? "checked" : ""}`}
                    >
                      {task.completed && <Check className="planner-check-icon" />}
                    </button>

                    <div className="planner-task-content">
                      <div className="planner-task-top">
                        <div className="planner-task-category">
                          {taskCategories[task.category].icon}
                          <span className="planner-category-name">
                            {task.category.charAt(0).toUpperCase() + task.category.slice(1)}
                          </span>
                        </div>
                        <div className="planner-task-meta">
                          <span className="planner-task-date">{formatDate(task.date)}</span>
                          <div className={`planner-priority-badge ${getPriorityColor(task.priority)}`}>
                            <Star className="planner-priority-icon" />
                            {task.priority}
                          </div>
                        </div>
                      </div>

                      {editingTask === task.id ? (
                        <div className="planner-edit-form">
                          <input
                            type="text"
                            defaultValue={task.text}
                            className="planner-edit-input"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                editTask(task.id, e.target.value)
                              }
                            }}
                            onBlur={(e) => editTask(task.id, e.target.value)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="planner-task-text">{task.text}</div>
                      )}
                    </div>
                  </div>

                  <div className="planner-task-actions">
                    <button
                      onClick={() => setEditingTask(task.id)}
                      className="planner-action-button planner-edit-button"
                      title="Edit task"
                    >
                      <Edit3 className="planner-action-icon" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="planner-action-button planner-delete-button"
                      title="Delete task"
                    >
                      <Trash2 className="planner-action-icon" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Garden Inspiration Section */}
      <section className="planner-inspiration-section">
        <div className="planner-inspiration-header">
          <h2 className="planner-section-title">
            <Upload className="planner-section-icon" />
            Garden Inspiration
          </h2>
          <p className="planner-inspiration-subtitle">Upload images of your garden or inspiration photos</p>
        </div>

        <div className="planner-upload-area">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setSelectedImage(URL.createObjectURL(e.target.files[0]))
              }
            }}
            className="planner-file-input"
            id="garden-image-upload"
          />
          <label htmlFor="garden-image-upload" className="planner-upload-label">
            <Upload className="planner-upload-icon" />
            <span className="planner-upload-text">Click to upload or drag and drop</span>
            <span className="planner-upload-hint">PNG, JPG, GIF up to 10MB</span>
          </label>
        </div>

        {selectedImage && (
          <div className="planner-uploaded-image-container">
            <img
              src={selectedImage || "/placeholder.svg"}
              alt="Garden inspiration"
              className="planner-uploaded-image"
            />
            <button onClick={() => setSelectedImage(null)} className="planner-remove-image" title="Remove image">
              <X className="planner-remove-icon" />
            </button>
          </div>
        )}
      </section>

      {/* Quick Tips Section */}
      <section className="planner-tips-section">
        <h2 className="planner-section-title">
          <Sun className="planner-section-icon" />
          Quick Gardening Tips
        </h2>
        <div className="planner-tips-grid">
          <div className="planner-tip-card">
            <div className="planner-tip-icon">💧</div>
            <h3>Watering Schedule</h3>
            <p>Water early morning or late evening to reduce evaporation and prevent leaf burn.</p>
          </div>
          <div className="planner-tip-card">
            <div className="planner-tip-icon">🌱</div>
            <h3>Planting Depth</h3>
            <p>Plant seeds at a depth 2-3 times their diameter for optimal germination.</p>
          </div>
          <div className="planner-tip-card">
            <div className="planner-tip-icon">✂️</div>
            <h3>Pruning Time</h3>
            <p>Prune flowering shrubs after they bloom to avoid cutting off next year's flowers.</p>
          </div>
          <div className="planner-tip-card">
            <div className="planner-tip-icon">🌞</div>
            <h3>Sun Requirements</h3>
            <p>Full sun = 6+ hours, partial sun = 3-6 hours, shade = less than 3 hours daily.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

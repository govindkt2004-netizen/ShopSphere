# 🛒 ShopSphere

A modern, secure, and full-stack e-commerce web application designed to provide a smooth shopping experience for customers and powerful management tools for administrators.

ShopSphere provides product browsing, authentication, shopping cart management, checkout, order management, role-based access control, and secure authentication features.

---

## ✨ Features

### 👤 User Features

- User registration and login
- Secure authentication
- Google Sign-In support
- Phone number authentication with OTP
- Browse products and categories
- Search and explore products
- Add products to cart
- Update product quantities
- Remove products from cart
- Checkout and order placement
- View order details
- Manage user profile
- Secure logout

### 🛡️ Admin Features

- Secure administrator authentication
- Admin-specific login protection
- Role-based access control
- Product management
- Add, edit, and delete products
- Category management
- User management
- Order management
- View application statistics
- Manage customer accounts
- Monitor orders and products

### 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based authorization
- OTP-based authentication
- Admin two-factor authentication
- Protected API routes
- Environment-based secret management
- Secure authentication flow

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- JavaScript / TypeScript
- HTML5
- CSS3
- Responsive UI

### Backend

- Node.js
- Express.js
- RESTful APIs

### Database

- MongoDB
- MongoDB Atlas

### Authentication & Security

- JWT
- bcrypt
- OTP Authentication
- Two-Factor Authentication
- Google Authentication

### Development & Deployment

- Git
- GitHub
- Vercel
- Render

---

## 📂 Project Structure

```text
ShopSphere/
│
├── client/                  # Frontend application
│
├── server/                  # Backend application
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── services/
│
├── public/                  # Static assets
│
├── .env                     # Environment variables
├── .gitignore
├── package.json
├── vite.config.ts
└── README.md
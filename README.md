# Iron Pulse Fitness | Premium Luxury Fitness Brand Website

An award-winning caliber, motion-driven, full-stack website for **Iron Pulse Fitness**, a high-end luxury fitness and wellness club. Engineered with premium custom animations, clean layouts, and a robust Node.js/Express backend API backed by MongoDB.

## Features

- **Luxury Aesthetic**: Dark premium layout featuring typography styling (`Bebas Neue` headers, `Poppins` body, and `Oswald` numbers) and custom brand colors.
- **GSAP Animation Suite**: Built-in percentage loader, split-character titles, sticky program scroll, statistics counting triggers, parallax imagery, cursor glow, and magnetic buttons.
- **Lenis Smooth Scroll**: Elegant scrolling mechanics integrated with GSAP ScrollTriggers.
- **Draggable Before/After Slider**: Real-time transformation tracking using custom pointer drags.
- **Interactive Timetable**: Timetable filtering dynamically by classes.
- **Interactive BMI Calculator**: On-the-fly indicator scaling with local history log caching.
- **Full-Stack API**:
  - `POST /api/inquiry` (Membership inquiries and invitations)
  - `POST /api/contact` (Customer messages)
  - `POST /api/newsletter` (Marketing list subscriptions)
  - `POST /api/bmi` (Save BMI logging history)
  - `GET /api/bmi/history` (Retrieve recent BMI history logs)

## Quick Start

### 1. Installation
Install the necessary package dependencies:
```bash
npm install
```

### 2. Configure Environment variables
Configure database connections in your `.env` file at the root:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```
*Note: If no `MONGODB_URI` is supplied, the server automatically defaults to an **in-memory backup storage state**, allowing the entire application to remain operational out-of-the-box for development testing.*

### 3. Launch Development Server
Launch the server locally:
```bash
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser to view the application.

## Directory Structure

```
├── models/
│   ├── Bmi.js           # BMI calculations schema
│   ├── Contact.js       # Contact message logs schema
│   ├── Inquiry.js       # Membership plan inquiries schema
│   └── Subscriber.js    # Newsletter subscriptions schema
├── public/
│   ├── css/
│   │   └── style.css    # Luxury styling system
│   ├── js/
│   │   ├── main.js      # Core animations (GSAP, Lenis, smoke particles)
│   │   └── components.js# Web components logic (BMI, timetable, sliders)
│   └── index.html       # HTML5 semantic structure
├── server.js            # Express application setup
└── package.json         # Project specifications
```

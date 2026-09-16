const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// FIX: Isse Express aapki HTML/CSS/JS files ko browser tak pahuncha payega
app.use(express.static(__dirname));

// Login Route
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
        return res.status(200).json({
            message: "Login successful!",
            user: { email: email }
        });
    } else {
        return res.status(400).json({
            message: "Invalid email or password"
        });
    }
});

// FIX: Dashboard route fix
app.get("/dashboard.html", (req, res) => {
    res.sendFile(path.join(__dirname, "dashboard.html"));
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(express.json())
app.use(cors())



app.get('/api/data', async (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('/home/pi/Desktop/solar_data.json', 'utf8'));
        res.json(data);
    } catch (error) {
        console.log("error")
    }
})




app.listen(4000, () => {
    console.log("server is running on 5000")
})

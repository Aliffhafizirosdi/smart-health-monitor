from flask import Flask, render_template, jsonify, request
import random
import time
from datetime import datetime, timedelta

app = Flask(__name__)

# In-memory storage for health readings
health_data = {
    "heart_rate": [],
    "temperature": [],
    "blood_oxygen": [],
    "blood_pressure": []
}

def generate_initial_data():
    """Generate some sample data to populate the dashboard on first load."""
    now = datetime.now()
    for i in range(20):
        timestamp = (now - timedelta(minutes=20 - i)).strftime("%H:%M:%S")
        health_data["heart_rate"].append({
            "value": random.randint(65, 95),
            "timestamp": timestamp
        })
        health_data["temperature"].append({
            "value": round(random.uniform(36.2, 37.2), 1),
            "timestamp": timestamp
        })
        health_data["blood_oxygen"].append({
            "value": random.randint(95, 100),
            "timestamp": timestamp
        })
        health_data["blood_pressure"].append({
            "systolic": random.randint(110, 135),
            "diastolic": random.randint(70, 90),
            "timestamp": timestamp
        })

generate_initial_data()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/readings", methods=["GET"])
def get_readings():
    """Return the latest health readings for the dashboard."""
    latest = {}
    for key in health_data:
        if health_data[key]:
            latest[key] = health_data[key][-1]
    latest["history"] = {
        "heart_rate": health_data["heart_rate"][-20:],
        "temperature": health_data["temperature"][-20:],
        "blood_oxygen": health_data["blood_oxygen"][-20:],
        "blood_pressure": health_data["blood_pressure"][-20:]
    }
    return jsonify(latest)


@app.route("/api/readings", methods=["POST"])
def add_reading():
    """Add a new health reading (simulates receiving data from a sensor)."""
    data = request.get_json()
    timestamp = datetime.now().strftime("%H:%M:%S")

    if "heart_rate" in data:
        health_data["heart_rate"].append({
            "value": data["heart_rate"],
            "timestamp": timestamp
        })
    if "temperature" in data:
        health_data["temperature"].append({
            "value": data["temperature"],
            "timestamp": timestamp
        })
    if "blood_oxygen" in data:
        health_data["blood_oxygen"].append({
            "value": data["blood_oxygen"],
            "timestamp": timestamp
        })
    if "systolic" in data and "diastolic" in data:
        health_data["blood_pressure"].append({
            "systolic": data["systolic"],
            "diastolic": data["diastolic"],
            "timestamp": timestamp
        })

    # Keep only the last 50 readings per metric
    for key in health_data:
        if len(health_data[key]) > 50:
            health_data[key] = health_data[key][-50:]

    return jsonify({"status": "ok", "timestamp": timestamp})


@app.route("/api/simulate", methods=["POST"])
def simulate():
    """Generate a new random reading to simulate live sensor input."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    new_hr = random.randint(60, 100)
    new_temp = round(random.uniform(36.0, 37.5), 1)
    new_spo2 = random.randint(94, 100)
    new_sys = random.randint(105, 140)
    new_dia = random.randint(65, 95)

    health_data["heart_rate"].append({"value": new_hr, "timestamp": timestamp})
    health_data["temperature"].append({"value": new_temp, "timestamp": timestamp})
    health_data["blood_oxygen"].append({"value": new_spo2, "timestamp": timestamp})
    health_data["blood_pressure"].append({
        "systolic": new_sys,
        "diastolic": new_dia,
        "timestamp": timestamp
    })

    for key in health_data:
        if len(health_data[key]) > 50:
            health_data[key] = health_data[key][-50:]

    return jsonify({
        "heart_rate": new_hr,
        "temperature": new_temp,
        "blood_oxygen": new_spo2,
        "systolic": new_sys,
        "diastolic": new_dia,
        "timestamp": timestamp
    })


@app.route("/api/alerts", methods=["GET"])
def check_alerts():
    """Check the latest readings and return any health alerts."""
    alerts = []
    if health_data["heart_rate"]:
        hr = health_data["heart_rate"][-1]["value"]
        if hr > 100:
            alerts.append({"type": "warning", "message": f"High heart rate detected: {hr} BPM"})
        elif hr < 60:
            alerts.append({"type": "warning", "message": f"Low heart rate detected: {hr} BPM"})

    if health_data["temperature"]:
        temp = health_data["temperature"][-1]["value"]
        if temp > 37.5:
            alerts.append({"type": "danger", "message": f"Elevated body temperature: {temp} C"})
        elif temp < 36.0:
            alerts.append({"type": "warning", "message": f"Low body temperature: {temp} C"})

    if health_data["blood_oxygen"]:
        spo2 = health_data["blood_oxygen"][-1]["value"]
        if spo2 < 95:
            alerts.append({"type": "danger", "message": f"Low blood oxygen level: {spo2}%"})

    if not alerts:
        alerts.append({"type": "normal", "message": "All vitals are within normal range"})

    return jsonify(alerts)


if __name__ == "__main__":
    app.run(debug=True, port=5000)

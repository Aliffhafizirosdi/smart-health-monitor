let hrChart, tempChart, spo2Chart, bpChart;

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        x: {
            grid: { color: "#1e2030" },
            ticks: { color: "#555", maxTicksLimit: 8, font: { size: 10 } }
        },
        y: {
            grid: { color: "#1e2030" },
            ticks: { color: "#555", font: { size: 10 } }
        }
    },
    elements: {
        line: { tension: 0.35, borderWidth: 2 },
        point: { radius: 0, hoverRadius: 5 }
    },
    animation: { duration: 400 }
};

function createChart(canvasId, label, color, yMin, yMax) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, color + "40");
    gradient.addColorStop(1, color + "00");

    return new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                backgroundColor: gradient,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    min: yMin,
                    max: yMax
                }
            }
        }
    });
}

function initCharts() {
    hrChart = createChart("hrChart", "Heart Rate", "#ef4444", 50, 120);
    tempChart = createChart("tempChart", "Temperature", "#f59e0b", 35, 39);
    spo2Chart = createChart("spo2Chart", "SpO2", "#3b82f6", 90, 102);

    const bpCtx = document.getElementById("bpChart").getContext("2d");
    bpChart = new Chart(bpCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Systolic",
                    data: [],
                    borderColor: "#a855f7",
                    backgroundColor: "#a855f710",
                    fill: false
                },
                {
                    label: "Diastolic",
                    data: [],
                    borderColor: "#6366f1",
                    backgroundColor: "#6366f110",
                    fill: false
                }
            ]
        },
        options: {
            ...chartOptions,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: "#888", font: { size: 11 } }
                }
            },
            scales: {
                ...chartOptions.scales,
                y: { ...chartOptions.scales.y, min: 50, max: 160 }
            }
        }
    });
}

function updateCharts(history) {
    if (history.heart_rate) {
        hrChart.data.labels = history.heart_rate.map(d => d.timestamp);
        hrChart.data.datasets[0].data = history.heart_rate.map(d => d.value);
        hrChart.update();
    }
    if (history.temperature) {
        tempChart.data.labels = history.temperature.map(d => d.timestamp);
        tempChart.data.datasets[0].data = history.temperature.map(d => d.value);
        tempChart.update();
    }
    if (history.blood_oxygen) {
        spo2Chart.data.labels = history.blood_oxygen.map(d => d.timestamp);
        spo2Chart.data.datasets[0].data = history.blood_oxygen.map(d => d.value);
        spo2Chart.update();
    }
    if (history.blood_pressure) {
        bpChart.data.labels = history.blood_pressure.map(d => d.timestamp);
        bpChart.data.datasets[0].data = history.blood_pressure.map(d => d.systolic);
        bpChart.data.datasets[1].data = history.blood_pressure.map(d => d.diastolic);
        bpChart.update();
    }
}

function updateStats(data) {
    if (data.heart_rate) {
        document.getElementById("hrValue").textContent = data.heart_rate.value;
    }
    if (data.temperature) {
        document.getElementById("tempValue").textContent = data.temperature.value;
    }
    if (data.blood_oxygen) {
        document.getElementById("spo2Value").textContent = data.blood_oxygen.value;
    }
    if (data.blood_pressure) {
        document.getElementById("bpValue").textContent =
            data.blood_pressure.systolic + "/" + data.blood_pressure.diastolic;
    }
}

async function fetchReadings() {
    try {
        const res = await fetch("/api/readings");
        const data = await res.json();
        updateStats(data);
        if (data.history) updateCharts(data.history);
    } catch (err) {
        console.error("Failed to fetch readings:", err);
    }
}

async function fetchAlerts() {
    try {
        const res = await fetch("/api/alerts");
        const alerts = await res.json();
        const bar = document.getElementById("alertsBar");
        bar.innerHTML = alerts.map(a => {
            const cls = a.type === "danger" ? "alert-danger" : a.type === "warning" ? "alert-warning" : "alert-normal";
            const icon = a.type === "danger" ? "&#9888;" : a.type === "warning" ? "&#9888;" : "&#10003;";
            return `<div class="alert ${cls}">${icon} ${a.message}</div>`;
        }).join("");
    } catch (err) {
        console.error("Failed to fetch alerts:", err);
    }
}

async function simulateReading() {
    const btn = document.getElementById("simulateBtn");
    btn.textContent = "Sending...";
    btn.disabled = true;

    try {
        await fetch("/api/simulate", { method: "POST" });
        await fetchReadings();
        await fetchAlerts();
    } catch (err) {
        console.error("Simulation failed:", err);
    }

    btn.textContent = "Simulate Sensor Reading";
    btn.disabled = false;
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    initCharts();
    fetchReadings();
    fetchAlerts();

    // Auto refresh every 5 seconds
    setInterval(() => {
        fetchReadings();
        fetchAlerts();
    }, 5000);
});

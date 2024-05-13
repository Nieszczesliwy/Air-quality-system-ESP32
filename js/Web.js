window.onload = function () {
  var conn;
  try {
    conn = new WebSocket("ws://192.168.0.104:81");
  } catch (error) {
    console.error("Failed to create WebSocket connection:", error);
    return;
  }
  var dataTemperature = [];
  var dataHumidity = [];
  var dataGas = [];

  var ctx = document.getElementById("myChart").getContext("2d");
  var chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Температура (°C)",
          data: dataTemperature,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          label: "Вологість (%)",
          data: dataHumidity,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          yAxisID: "y1",
        },
        {
          label: "Рівень газу (Mq-135)",
          data: dataGas,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          yAxisID: "y2",
        },
      ],
    },
    options: {
      scales: {
        y: {
          type: "linear",
          display: true,
          position: "left",
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
        },
        y2: {
          type: "linear",
          display: true,
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  });

  function calculateAverage(array) {
    var sum = 0;
    for (var i = 0; i < array.length; i++) {
      sum += array[i].y;
    }
    return sum / array.length;
  }

  function calculateMax(array) {
    return Math.max.apply(
      Math,
      array.map(function (o) {
        return o.y;
      })
    );
  }

  function calculateMin(array) {
    return Math.min.apply(
      Math,
      array.map(function (o) {
        return o.y;
      })
    );
  }

  function calculateVariance(array, average) {
    var sum = 0;
    for (var i = 0; i < array.length; i++) {
      sum += Math.pow(array[i].y - average, 2);
    }
    return sum / array.length;
  }

  conn.onmessage = function (e) {
    var now = new Date().toLocaleTimeString();
    var dataString = e.data;
    var parts = dataString.split(",");
    if (parts.length < 3) {
      console.error("Помилка формату даних: " + dataString);
      return;
    }

    var avgTemperature = calculateAverage(dataTemperature);
    var avgHumidity = calculateAverage(dataHumidity);
    var avgGas = calculateAverage(dataGas);

    var maxTemperature = calculateMax(dataTemperature);
    var minTemperature = calculateMin(dataTemperature);
    var varianceTemperature = calculateVariance(
      dataTemperature,
      avgTemperature
    );

    var maxHumidity = calculateMax(dataHumidity);
    var minHumidity = calculateMin(dataHumidity);
    var varianceHumidity = calculateVariance(dataHumidity, avgHumidity);

    var maxGas = calculateMax(dataGas);
    var minGas = calculateMin(dataGas);
    var varianceGas = calculateVariance(dataGas, avgGas);

    var temperature = parseFloat(parts[0].split(":")[1].trim());
    var humidity = parseFloat(parts[1].split(":")[1].trim());
    var gas = parseFloat(parts[2].split(":")[1].trim());
    var avgTemperature = calculateAverage(dataTemperature);
    var avgHumidity = calculateAverage(dataHumidity);
    var avgGas = calculateAverage(dataGas);

    if (isNaN(temperature) || isNaN(humidity) || isNaN(gas)) {
      console.error("Помилка формату даних: " + dataString);
      return;
    }

    document.getElementById("sensorData").innerHTML =
      "Останні дані | " +
      "Температура: " +
      temperature +
      " °C, Вологість: " +
      humidity +
      "%, Рівень газу: " +
      gas;
    document.getElementById("sensorDataAvg").innerHTML =
      "Середня температура: " +
      avgTemperature.toFixed(2) +
      " °C, Середня вологість: " +
      avgHumidity.toFixed(2) +
      "%, Середній рівень газу: " +
      avgGas.toFixed(2);

    document.getElementById("sensorDataStats").innerHTML =
      "Макс. температура: " +
      maxTemperature.toFixed(2) +
      " °C, Мін. температура: " +
      minTemperature.toFixed(2) +
      " °C, Дисперсія температури: " +
      varianceTemperature.toFixed(2) +
      "<br>" +
      "Макс. вологість: " +
      maxHumidity.toFixed(2) +
      " %, Мін. вологість: " +
      minHumidity.toFixed(2) +
      " %, Дисперсія вологості: " +
      varianceHumidity.toFixed(2) +
      "<br>" +
      "Макс. рівень газу: " +
      maxGas.toFixed(2) +
      ", Мін. рівень газу: " +
      minGas.toFixed(2) +
      ", Дисперсія рівня газу: " +
      varianceGas.toFixed(2);

    if (dataTemperature.length > 20) {
      dataTemperature.shift();
      dataHumidity.shift();
      dataGas.shift();
      chart.data.labels.shift();
    }

    dataTemperature.push({ x: now, y: temperature });
    dataHumidity.push({ x: now, y: humidity });
    dataGas.push({ x: now, y: gas });
    chart.data.labels.push(now);
    chart.update();
  };

  conn.onopen = function () {
    console.log("Підключенно");
  };

  conn.onerror = function (e) {
    console.log("Помилка!");
  };
  conn.onerror = function (error) {
    console.error("WebSocket error:", error);
    document.getElementById("sensorData").innerHTML =
      "Помилка підключення до сервера! Перезавантажте сторінку Win + R.";
  };
  
  document.getElementById("delaySelect").addEventListener("change", function (event) {
    console.log("Interval:" + event.target.value);
    conn.send("Interval:" + event.target.value);
  });

  document
    .getElementById("temperatureChartType")
    .addEventListener("change", function (event) {
      chart.data.datasets[0].type = event.target.value;
      chart.update();
    });

  document
    .getElementById("humidityChartType")
    .addEventListener("change", function (event) {
      chart.data.datasets[1].type = event.target.value;
      chart.update();
    });

  document
    .getElementById("gasChartType")
    .addEventListener("change", function (event) {
      chart.data.datasets[2].type = event.target.value;
      chart.update();
    });
};

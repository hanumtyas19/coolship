import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";

interface ChartData {
  time: string;
  temperature: number;
  humidity: number;
}

export default function EChartTempPh({ data }: { data: ChartData[] }) {
  const maxPoints = 30;
  const slicedData = data.slice(-maxPoints);

  const tempValues = slicedData.map((d) => d.temperature);
  const humidityValues = slicedData.map((d) => d.humidity);

  const tempMin = Math.min(...tempValues) - 2;
  const tempMax = Math.max(...tempValues) + 2;
  const humMin = Math.min(...humidityValues) - 1;
  const humMax = Math.max(...humidityValues) + 1;

  const option = useMemo(() => {
    return {
      title: {
        text: "Live Temp & Humidity",
        left: "center",
      },
      animation: true,
      animationDuration: 500,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["Temperature", "Humidity"],
        top: 30,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: slicedData.map((d) => d.time),
        axisLabel: {
          fontSize: 10,
          rotate: 45,
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Temperature (°C)",
          min: tempMin,
          max: tempMax,
        },
        {
          type: "value",
          name: "Humidity",
          min: humMin,
          max: humMax,
        },
      ],
      series: [
        {
          name: "Temperature",
          type: "line",
          yAxisIndex: 0,
          data: slicedData.map((d) => d.temperature),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: "#ff6384",
            width: 3,
          },
          areaStyle: {
            color: "rgba(255, 99, 132, 0.1)",
          },
          progressive: 500,
          animationDurationUpdate: 300,
        },
        {
          name: "Humidity",
          type: "line",
          yAxisIndex: 1,
          data: slicedData.map((d) => d.humidity),
          smooth: true,
          showSymbol: false,
          lineStyle: {
            color: "#36a2eb",
            width: 3,
          },
          areaStyle: {
            color: "rgba(54, 162, 235, 0.1)",
          },
          progressive: 500,
          animationDurationUpdate: 300,
        },
      ],
    };
  }, [slicedData]);

  return (
    <ReactECharts
      option={option}
      style={{ height: 300, width: "100%" }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}

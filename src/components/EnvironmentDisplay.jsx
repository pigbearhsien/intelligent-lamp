import { Thermometer, Droplets, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function EnvironmentDisplay() {
  const [env, setEnv] = useState({ temp: 24, humidity: 55, brightness: 72 });

  useEffect(() => {
    // Simulate sensor data with slight random variation
    const interval = setInterval(() => {
      setEnv({
        temp: 22 + Math.round(Math.random() * 6),
        humidity: 45 + Math.round(Math.random() * 25),
        brightness: 60 + Math.round(Math.random() * 30),
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    { icon: Thermometer, value: `${env.temp}°C`, label: "溫度", color: "text-red-500", bg: "bg-red-50" },
    { icon: Droplets, value: `${env.humidity}%`, label: "濕度", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: Sun, value: `${env.brightness} lux`, label: "亮度", color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3 bg-card rounded-xl p-4 border">
          <div className={`${item.bg} p-2.5 rounded-lg`}>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </div>
          <div>
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
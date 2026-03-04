'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cloud, Droplets, Wind, Sun, Loader2 } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  humidity: number;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Default to Prague/Central Europe if geolocation fails or is denied
    const defaultLat = 50.0755;
    const defaultLon = 14.4378;

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
        );
        const data = await res.json();
        
        setWeather({
          temperature: data.current.temperature_2m,
          condition: getWeatherCondition(data.current.weather_code),
          windSpeed: data.current.wind_speed_10m,
          humidity: data.current.relative_humidity_2m,
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load weather');
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback
          fetchWeather(defaultLat, defaultLon);
        }
      );
    } else {
      fetchWeather(defaultLat, defaultLon);
    }
  }, []);

  function getWeatherCondition(code: number): string {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rainy';
    if (code >= 71 && code <= 77) return 'Snowy';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
  }

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  if (error) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-2xl p-8 h-full flex flex-col justify-between relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-white/10 transition-colors duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-medium tracking-widest uppercase text-white/50">Current Weather</span>
          <Sun className="w-5 h-5 text-white/80" />
        </div>
        
        <div className="flex flex-col">
          <span className="text-5xl font-serif font-light tracking-tight mb-2">
            {weather?.temperature}°
          </span>
          <span className="text-lg text-white/70 font-light">
            {weather?.condition}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
        <div className="flex items-center gap-3">
          <Wind className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/60">{weather?.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-3">
          <Droplets className="w-4 h-4 text-white/40" />
          <span className="text-sm text-white/60">{weather?.humidity}%</span>
        </div>
      </div>
    </motion.div>
  );
}

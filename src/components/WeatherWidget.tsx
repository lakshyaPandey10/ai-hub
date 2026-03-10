import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Cloud, Droplets, Wind, Thermometer, Search, MapPin, Eye } from "lucide-react";
import { toast } from "sonner";

const API_KEY = "10e8dcf2f97a420084d41819262702";

interface WeatherData {
  location: { name: string; country: string; localtime: string };
  current: {
    temp_c: number;
    condition: { text: string; icon: string };
    humidity: number;
    wind_kph: number;
    feelslike_c: number;
    vis_km: number;
    uv: number;
  };
}

const WeatherWidget = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async () => {
    if (!city.trim()) { toast.error("Enter a city name"); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)}&aqi=no`);
      if (!res.ok) throw new Error("City not found");
      const data = await res.json();
      setWeather(data);
    } catch {
      toast.error("Weather data not found, check city name");
    }
    setLoading(false);
  };

  return (
    <Card className="glass-card neon-border h-full">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/20">
            <Cloud className="w-4 h-4 text-primary" />
          </div>
          <span className="gradient-text font-display text-base tracking-wide">Weather</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search city..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
              className="bg-muted/30 pl-9 h-11"
            />
          </div>
          <Button onClick={fetchWeather} disabled={loading} size="icon" className="bg-primary/20 text-primary hover:bg-primary/30 h-11 w-11">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {!weather && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <Cloud className="w-16 h-16 mx-auto text-primary/10 mb-4" />
            <p className="text-sm text-muted-foreground">Search a city to get weather info</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {weather && !loading && (
          <div className="space-y-5 animate-scale-in">
            {/* Main temp */}
            <div className="text-center p-6 rounded-2xl gradient-bg border border-primary/10">
              <img src={weather.current.condition.icon} alt={weather.current.condition.text} className="mx-auto w-20 h-20 drop-shadow-lg" />
              <h3 className="text-5xl font-bold text-foreground font-display mt-2">
                {weather.current.temp_c}°
              </h3>
              <p className="text-muted-foreground text-sm mt-1">{weather.current.condition.text}</p>
              <p className="text-primary text-sm font-semibold mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3" />
                {weather.location.name}, {weather.location.country}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Thermometer, label: "Feels Like", value: `${weather.current.feelslike_c}°C`, color: "text-accent" },
                { icon: Droplets, label: "Humidity", value: `${weather.current.humidity}%`, color: "text-primary" },
                { icon: Wind, label: "Wind", value: `${weather.current.wind_kph} km/h`, color: "text-secondary" },
                { icon: Eye, label: "Visibility", value: `${weather.current.vis_km} km`, color: "text-muted-foreground" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-xl bg-muted/10 border border-border hover:border-primary/20 transition-colors">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;

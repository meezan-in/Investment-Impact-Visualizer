import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  User,
  Plus,
  Filter,
  Map,
  Building,
  X,
  MapPin,
  Brush,
  Eye,
  Wifi,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Deal interface
interface Deal {
  id: number;
  name: string;
  sector: string;
  location: string;
  coordinates: [number, number];
  currentFunding: number;
  targetFunding: number;
  progress: number;
  description: string;
}

// Authentic Bengaluru business data with real coordinates
const dealsData: Deal[] = [
  {
    id: 1,
    name: "Toit Brewpub",
    sector: "Food & Beverage",
    location: "Indiranagar",
    coordinates: [12.9716, 77.5946],
    currentFunding: 250000,
    targetFunding: 500000,
    progress: 50,
    description:
      "Expanding craft beer operations with focus on sustainable brewing practices and local ingredient sourcing.",
  },
  {
    id: 2,
    name: "Asha Textiles",
    sector: "Manufacturing",
    location: "Peenya",
    coordinates: [13.0296, 77.5186],
    currentFunding: 820000,
    targetFunding: 1000000,
    progress: 82,
    description:
      "Modernizing textile production with eco-friendly processes and automation technology.",
  },
  {
    id: 3,
    name: "Third Wave Coffee",
    sector: "Food & Beverage",
    location: "Koramangala",
    coordinates: [12.9352, 77.6245],
    currentFunding: 380000,
    targetFunding: 1200000,
    progress: 32,
    description:
      "Opening new specialty coffee outlets across Bengaluru with focus on premium blends and artisanal brewing.",
  },
  {
    id: 4,
    name: "NextGen Software",
    sector: "Technology",
    location: "Electronic City",
    coordinates: [12.8456, 77.6603],
    currentFunding: 1560000,
    targetFunding: 2000000,
    progress: 78,
    description:
      "Developing AI-powered solutions for small and medium enterprises in Bengaluru's tech ecosystem.",
  },
  {
    id: 5,
    name: "Bangalore Spice Works",
    sector: "Food & Beverage",
    location: "Chickpet",
    coordinates: [12.9698, 77.5804],
    currentFunding: 150000,
    targetFunding: 300000,
    progress: 50,
    description:
      "Traditional spice processing and packaging with modern quality control systems.",
  },
  {
    id: 6,
    name: "Urban Mobility Solutions",
    sector: "Technology",
    location: "Whitefield",
    coordinates: [12.9698, 77.75],
    currentFunding: 750000,
    targetFunding: 1500000,
    progress: 50,
    description:
      "Developing smart transportation solutions for urban commuters in Bengaluru.",
  },
  {
    id: 7,
    name: "Eco Fashion Hub",
    sector: "Retail",
    location: "Commercial Street",
    coordinates: [12.9853, 77.6094],
    currentFunding: 200000,
    targetFunding: 500000,
    progress: 40,
    description:
      "Sustainable fashion retail focusing on eco-friendly materials and ethical manufacturing.",
  },
  {
    id: 8,
    name: "Bangalore Artisan Crafts",
    sector: "Manufacturing",
    location: "Jayanagar",
    coordinates: [12.9279, 77.5937],
    currentFunding: 90000,
    targetFunding: 200000,
    progress: 45,
    description:
      "Traditional handicrafts and artisan products with modern marketing and distribution.",
  },
];

const Home: React.FC = () => {
  // State management as per specifications
  const [isLowDataMode, setIsLowDataMode] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState("funding-desc");
  const [activeDealId, setActiveDealId] = useState<number | null>(1);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [locationStatus, setLocationStatus] = useState("Detecting location...");
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    type?: string;
    effectiveType?: string;
    downlink?: number;
  }>({});
  // Add state for IP address
  const [ipAddress, setIpAddress] = useState<string>("");

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dealsContainerRef = useRef<HTMLDivElement>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Memoized filtered and sorted deals
  const filteredAndSortedDeals = useMemo(() => {
    let filtered = deals;

    // Filter by sector
    if (activeFilter !== "All") {
      filtered = deals.filter((deal) => deal.sector === activeFilter);
    }

    // Sort deals
    const sorted = [...filtered].sort((a, b) => {
      switch (activeSort) {
        case "funding-desc":
          return b.currentFunding - a.currentFunding;
        case "funding-asc":
          return a.currentFunding - b.currentFunding;
        case "progress-desc":
          return b.progress - a.progress;
        case "name-asc":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [deals, activeFilter, activeSort]);

  // Network Information API implementation - Enhanced
  useEffect(() => {
    const updateNetworkInfo = () => {
      if ("connection" in navigator) {
        const connection = (navigator as any).connection;
        setNetworkInfo({
          type: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
        });
      }
    };

    updateNetworkInfo();

    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener("change", updateNetworkInfo);
      return () => {
        connection.removeEventListener("change", updateNetworkInfo);
      };
    }
  }, []);

  // Geolocation API implementation - Enhanced
  useEffect(() => {
    const getUserLocation = () => {
      console.log("📍 Geolocation API: Requesting user location...");
      if (!navigator.geolocation) {
        console.log("📍 Geolocation API: Not supported in this browser");
        setLocationStatus("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          console.log(
            `📍 Geolocation API: Location found - Lat: ${userLat}, Lng: ${userLng}, Accuracy: ${accuracy}m`
          );
          setUserLocation([userLat, userLng]);
          setLocationStatus(`Location found (±${Math.round(accuracy)}m)`);
        },
        (error) => {
          console.error("📍 Geolocation API: Error:", error.message);
          setLocationStatus("Location access denied");
          // Default to Cubbon Park, Bengaluru
          setUserLocation([12.9716, 77.5946]);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    };

    getUserLocation();
  }, []);

  // Initialize map with better implementation
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || deals.length === 0) return;

      try {
        // Dynamically import Leaflet and CSS
        const L = await import("leaflet");

        // Import Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Clear existing map if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Initialize map centered on Bengaluru
        const map = L.map(mapRef.current, {
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          touchZoom: true,
        }).setView([12.9716, 77.5946], 11);

        // Add OpenStreetMap tiles for light theme
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Custom marker icon for deals
        const dealIcon = L.divIcon({
          className: "custom-marker",
          html: `<div class="w-6 h-6 bg-[#2DD4BF] rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                   <div class="w-2 h-2 bg-white rounded-full"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        // Add deal markers
        deals.forEach((deal) => {
          const marker = L.marker(deal.coordinates, { icon: dealIcon }).addTo(
            map
          );

          // Create popup content
          const popupContent = `
            <div class="p-2 min-w-[200px]">
              <h3 class="font-bold text-lg mb-1">${deal.name}</h3>
              <p class="text-sm text-gray-600 mb-2">${deal.sector} • ${
            deal.location
          }</p>
              <div class="mb-2">
                <div class="text-xs text-gray-500">Funding Progress</div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-[#2DD4BF] h-2 rounded-full" style="width: ${
                    deal.progress
                  }%"></div>
                </div>
                <div class="text-xs text-gray-600 mt-1">${deal.progress}% (₹${(
            deal.currentFunding / 100000
          ).toFixed(1)}L / ₹${(deal.targetFunding / 100000).toFixed(1)}L)</div>
              </div>
              <button class="bg-[#2DD4BF] text-black px-3 py-1 rounded text-sm font-medium hover:bg-[#2DD4BF]/80" 
                      onclick="window.selectDeal(${deal.id})">
                View Details
              </button>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 250,
            className: "custom-popup",
          });

          marker.on("click", () => {
            setActiveDealId(deal.id);
          });
        });

        // Add user location marker if available
        if (userLocation) {
          const userIcon = L.divIcon({
            className: "user-marker",
            html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-marker"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          L.marker(userLocation, { icon: userIcon })
            .addTo(map)
            .bindPopup("Your location")
            .openPopup();

          map.setView(userLocation, 12);
        }

        // Global function for popup buttons
        (window as any).selectDeal = (dealId: number) => {
          const deal = deals.find((d) => d.id === dealId);
          if (deal) {
            setSelectedDeal(deal);
            setActiveDealId(dealId);
          }
        };

        mapInstanceRef.current = map;
      } catch (error) {
        console.error("Failed to initialize map:", error);
        // Fallback: show a simple canvas-based visualization
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#1f2937";
            ctx.fillRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
            ctx.fillStyle = "#2DD4BF";
            ctx.font = "16px Inter";
            ctx.textAlign = "center";
            ctx.fillText(
              "Map temporarily unavailable",
              canvasRef.current.width / 2,
              canvasRef.current.height / 2
            );
          }
        }
      }
    };

    if (deals.length > 0) {
      initializeMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [deals, userLocation]);

  // Canvas API implementation for custom markers - Enhanced
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapInstanceRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log("🎨 Canvas API: Context not available");
      return;
    }

    console.log("🎨 Canvas API: Initializing canvas overlay");

    // Resize canvas to match map container
    const resizeCanvas = () => {
      if (mapRef.current) {
        canvas.width = mapRef.current.offsetWidth;
        canvas.height = mapRef.current.offsetHeight;
        console.log(
          `🎨 Canvas API: Canvas resized to ${canvas.width}x${canvas.height}`
        );
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation loop for pulsing active marker
    const animateMarkers = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Find active deal
      const activeDeal = deals.find((deal) => deal.id === activeDealId);
      if (activeDeal && mapInstanceRef.current) {
        try {
          // Convert lat/lng to pixel coordinates using Leaflet's projection
          const point = mapInstanceRef.current.latLngToContainerPoint(
            activeDeal.coordinates
          );

          // Draw pulsing circle for active deal with mathematical timing
          const time = Date.now() * 0.002;
          const radius = 15 + Math.sin(time) * 5; // Pulsing radius between 10-20px
          const alpha = 0.3 + Math.sin(time) * 0.2; // Pulsing alpha between 0.1-0.5

          // Outer pulsing glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(45, 212, 191, ${alpha})`;
          ctx.fill();

          // Draw progress arc - mathematical conversion for progress percentage to radians
          const progress = activeDeal.progress / 100;
          ctx.beginPath();
          // Start from top (-PI/2) and draw clockwise based on progress (0-2π)
          ctx.arc(
            point.x,
            point.y,
            25,
            -Math.PI / 2,
            -Math.PI / 2 + progress * 2 * Math.PI
          );
          ctx.strokeStyle = "#2DD4BF";
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.stroke();

          // Inner solid circle
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = "#2DD4BF";
          ctx.fill();

          console.log(
            `🎨 Canvas API: Drew marker at (${point.x}, ${point.y}) for ${activeDeal.name}`
          );
        } catch (error) {
          console.error("🎨 Canvas API: Drawing error:", error);
        }
      }

      if (!isLowDataMode) {
        animationFrameRef.current = requestAnimationFrame(animateMarkers);
      }
    };

    animateMarkers();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      console.log("🎨 Canvas API: Cleanup completed");
    };
  }, [deals, activeDealId, isLowDataMode]);

  // Intersection Observer API implementation - Enhanced
  useEffect(() => {
    console.log("👁️ Intersection Observer API: Setting up observer...");
    const dealCards = dealsContainerRef.current?.querySelectorAll(".deal-card");
    if (!dealCards || dealCards.length === 0) {
      console.log("👁️ Intersection Observer API: No deal cards found");
      return;
    }

    console.log(
      `👁️ Intersection Observer API: Observing ${dealCards.length} deal cards`
    );

    const observer = new IntersectionObserver(
      (entries) => {
        let highestRatio = 0;
        let mostVisibleDeal: Element | null = null;

        entries.forEach((entry) => {
          const ratio = entry.intersectionRatio;
          const dealId = entry.target.getAttribute("data-deal-id");
          console.log(
            `👁️ Intersection Observer API: Deal ${dealId} visibility: ${(
              ratio * 100
            ).toFixed(1)}%`
          );

          if (ratio > highestRatio) {
            highestRatio = ratio;
            mostVisibleDeal = entry.target;
          }
        });

        if (mostVisibleDeal && highestRatio > 0.6) {
          const dealId = parseInt(
            mostVisibleDeal.getAttribute("data-deal-id") || "0"
          );
          if (dealId && dealId !== activeDealId) {
            console.log(
              `👁️ Intersection Observer API: Activating deal ${dealId} (${(
                highestRatio * 100
              ).toFixed(1)}% visible)`
            );
            setActiveDealId(dealId);
          }
        }
      },
      {
        root: dealsContainerRef.current,
        threshold: [0.1, 0.3, 0.6, 0.9],
        rootMargin: "0px 0px -20% 0px",
      }
    );

    dealCards.forEach((card) => observer.observe(card));
    intersectionObserverRef.current = observer;

    return () => {
      observer.disconnect();
      console.log("👁️ Intersection Observer API: Observer disconnected");
    };
  }, [filteredAndSortedDeals, activeDealId]);

  // Initialize deals data
  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setDeals(dealsData);
      setIsLoading(false);
    }, 1500);
  }, []);

  // Fetch IP address on mount
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => setIpAddress("Unavailable"));
  }, []);

  // Filter change handler
  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
  }, []);

  // Sort change handler
  const handleSortChange = useCallback((sort: string) => {
    setActiveSort(sort);
  }, []);

  // Deal card click handler
  const handleDealClick = useCallback((deal: Deal) => {
    setSelectedDeal(deal);
    setActiveDealId(deal.id);
  }, []);

  // Investment handlers
  const handleNewInvestment = useCallback(() => {
    setShowInvestmentModal(true);
  }, []);

  const handleInvestmentSubmit = useCallback(() => {
    if (investmentAmount && selectedDeal) {
      // Simulate investment process
      alert(
        `Investment of ₹${investmentAmount} in ${selectedDeal.name} submitted successfully!`
      );
      setShowInvestmentModal(false);
      setInvestmentAmount("");
      setSelectedDeal(null);
    }
  }, [investmentAmount, selectedDeal]);

  // Profile handler
  const handleProfileClick = useCallback(() => {
    setShowProfileModal(true);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  // Get unique sectors for filtering
  const sectors = useMemo(() => {
    const uniqueSectors = [...new Set(deals.map((deal) => deal.sector))];
    return uniqueSectors;
  }, [deals]);

  if (isLoading) {
    return (
      <div className="min-h-screen aurora-bg">
        <div className="fixed inset-0 aurora-bg -z-10" />
        {/* Skeleton loader */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-32 w-full skeleton-shimmer" />
              <Skeleton className="h-96 w-full skeleton-shimmer" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[600px] w-full skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Aurora Background */}
      <div className="fixed inset-0 aurora-bg -z-10" />

      {/* Low Data Mode Banner */}
      {isLowDataMode && (
        <div className="bg-purple-600 text-white text-center p-2 text-sm">
          Low-data mode enabled for a faster experience.
        </div>
      )}

      {/* Header */}
      <header className="glass-morphism sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#2DD4BF] rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-xl font-bold">Bengaluru Impact Visualizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="glass-morphism text-white hover:bg-white/10"
                onClick={handleProfileClick}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                className="bg-[#2DD4BF] hover:bg-[#2DD4BF]/80 text-black glow-button"
                onClick={handleNewInvestment}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Investment
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Problem & Solution Section */}
        <section className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-[#2DD4BF] to-[#8B5CF6] bg-clip-text text-transparent">
            The Problem: Digital investments feel abstract and disconnected.
          </h1>
          <h2 className="text-2xl lg:text-3xl font-semibold mb-8 text-gray-300">
            Our Solution: We make your investments tangible by visually
            connecting you to the real-world Bengaluru businesses you're
            empowering.
          </h2>
          <div className="glass-morphism p-8 rounded-2xl max-w-4xl mx-auto">
            <p className="text-lg text-gray-300 leading-relaxed">
              Experience the future of investment transparency. See exactly
              where your money goes, track the real businesses you're
              supporting, and witness the tangible impact of your financial
              decisions in Bengaluru's thriving ecosystem.
            </p>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Controls & Deals */}
          <div className="space-y-6">
            {/* Controls Section */}
            <Card className="glass-morphism border-white/10">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <Filter className="w-5 h-5 mr-2 text-[#2DD4BF]" />
                  Filter & Sort Deals
                </h3>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    onClick={() => handleFilterChange("All")}
                    className={`text-sm ${
                      activeFilter === "All"
                        ? "bg-[#2DD4BF] text-black glow-button"
                        : "glass-morphism text-white hover:bg-white/10"
                    }`}
                  >
                    All Sectors
                  </Button>
                  <Button
                    onClick={() => handleFilterChange("Technology")}
                    className={`text-sm ${
                      activeFilter === "Technology"
                        ? "bg-[#2DD4BF] text-black glow-button"
                        : "glass-morphism text-white hover:bg-white/10"
                    }`}
                  >
                    Technology
                  </Button>
                  <Button
                    onClick={() => handleFilterChange("Food & Beverage")}
                    className={`text-sm ${
                      activeFilter === "Food & Beverage"
                        ? "bg-[#2DD4BF] text-black glow-button"
                        : "glass-morphism text-white hover:bg-white/10"
                    }`}
                  >
                    Food & Beverage
                  </Button>
                  <Button
                    onClick={() => handleFilterChange("Manufacturing")}
                    className={`text-sm ${
                      activeFilter === "Manufacturing"
                        ? "bg-[#2DD4BF] text-black glow-button"
                        : "glass-morphism text-white hover:bg-white/10"
                    }`}
                  >
                    Manufacturing
                  </Button>
                  <Button
                    onClick={() => handleFilterChange("Retail")}
                    className={`text-sm ${
                      activeFilter === "Retail"
                        ? "bg-[#2DD4BF] text-black glow-button"
                        : "glass-morphism text-white hover:bg-white/10"
                    }`}
                  >
                    Retail
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-300">
                    Sort by:
                  </label>
                  <Select value={activeSort} onValueChange={handleSortChange}>
                    <SelectTrigger className="glass-morphism border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-white/10">
                      <SelectItem value="funding-desc">
                        Funding (High to Low)
                      </SelectItem>
                      <SelectItem value="funding-asc">
                        Funding (Low to High)
                      </SelectItem>
                      <SelectItem value="progress-desc">
                        Progress (High to Low)
                      </SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Deals Feed */}
            <Card className="glass-morphism border-white/10">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <Building className="w-5 h-5 mr-2 text-[#2DD4BF]" />
                  Investment Opportunities
                </h3>

                <div
                  ref={dealsContainerRef}
                  className="space-y-6 max-h-96 overflow-y-auto pr-2"
                >
                  {filteredAndSortedDeals.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      No deals match your criteria.
                    </div>
                  ) : (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.1,
                          },
                        },
                      }}
                    >
                      {filteredAndSortedDeals.map((deal) => (
                        <motion.div
                          key={deal.id}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                          }}
                          className={`deal-card glass-morphism p-4 rounded-xl cursor-pointer ${
                            activeDealId === deal.id ? "active-deal" : ""
                          }`}
                          data-deal-id={deal.id}
                          onClick={() => handleDealClick(deal)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-lg text-white">
                                {deal.name}
                              </h4>
                              <p className="text-sm text-gray-400">
                                {deal.sector} • {deal.location}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-[#2DD4BF] font-semibold">
                                {formatCurrency(deal.currentFunding)}
                              </div>
                              <div className="text-xs text-gray-400">
                                Target: {formatCurrency(deal.targetFunding)}
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white">
                                Funding Progress
                              </span>
                              <span className="text-[#2DD4BF]">
                                {deal.progress}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-[#2DD4BF] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${deal.progress}%` }}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-3">
                            {deal.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {deal.coordinates[0].toFixed(4)}° N,{" "}
                                {deal.coordinates[1].toFixed(4)}° E
                              </span>
                            </div>
                            <Button
                              size="sm"
                              className="bg-[#2DD4BF] hover:bg-[#2DD4BF]/80 text-black glow-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDeal(deal);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Map */}
          <div className="space-y-6">
            <Card className="glass-morphism border-white/10">
              <CardContent className="p-6 h-[600px]">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <Map className="w-5 h-5 mr-2 text-[#2DD4BF]" />
                  Bengaluru Business Map
                </h3>

                {/* Map Container */}
                <div className="w-full h-full rounded-xl overflow-hidden relative">
                  <div ref={mapRef} className="w-full h-full" />

                  {/* Canvas Layer for Custom Markers */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                  />

                  {/* Geolocation Status */}
                  <div className="absolute top-4 right-4 glass-morphism px-3 py-2 rounded-lg text-sm">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    <span>{locationStatus}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Legend */}
            <Card className="glass-morphism border-white/10">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-white">Map Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-[#2DD4BF] rounded-full pulse-marker" />
                    <span className="text-sm text-white">
                      Active Investment
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-[#8B5CF6] rounded-full" />
                    <span className="text-sm text-white">
                      Available Opportunity
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gray-500 rounded-full" />
                    <span className="text-sm text-white">Your Location</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-morphism mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* APIs Used Section */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">
                APIs Used in this Project
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-[#2DD4BF]" />
                    <span className="text-sm text-white">Geolocation API</span>
                  </div>
                  <div
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    title="Active - User location tracking"
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Brush className="w-5 h-5 text-[#2DD4BF]" />
                    <span className="text-sm text-white">Canvas API</span>
                  </div>
                  <div
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    title="Active - Custom marker animations"
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-5 h-5 text-[#2DD4BF]" />
                    <span className="text-sm text-white">
                      Intersection Observer API
                    </span>
                  </div>
                  <div
                    className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    title="Active - Deal card visibility tracking"
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Wifi className="w-5 h-5 text-[#2DD4BF]" />
                    <span className="text-sm text-white">
                      Network Information API
                    </span>
                  </div>
                  <div
                    className={`w-2 h-2 ${
                      isLowDataMode ? "bg-yellow-500" : "bg-green-500"
                    } rounded-full animate-pulse`}
                    title={
                      isLowDataMode
                        ? "Active - Low data mode enabled"
                        : "Active - Normal speed connection"
                    }
                  ></div>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-400">
                All APIs are actively monitoring and enhancing your experience
              </div>
            </div>

            {/* About Section */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">
                About the Project
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                The Bengaluru Impact Visualizer bridges the gap between digital
                investments and real-world impact, providing transparency and
                tangible connection to local businesses.
              </p>
            </div>

            {/* Contact Section */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-[#2DD4BF]" />
                  <span className="text-sm text-white">
                    info@bengaluruimpact.com
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-[#2DD4BF]" />
                  <span className="text-sm text-white">+91 XXXX-XXXX-XXXX</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-400 mb-2">
              Designed & Developed by Mohammad Meezan
            </p>
            <p className="text-xs text-gray-500">
              * All data displayed is dummy/simulated content for demonstration
              purposes only
            </p>
          </div>
          {/* In the footer, update the network info display */}
          <div className="mt-8 text-xs text-gray-400 text-center">
            {ipAddress && <span>Your IP: {ipAddress} | </span>}
            Network:{" "}
            {networkInfo.type === "wifi"
              ? "WiFi"
              : networkInfo.type === "cellular"
              ? "Cellular"
              : "Unknown"}{" "}
            ({networkInfo.effectiveType || "N/A"},{" "}
            {networkInfo.downlink || "N/A"} Mbps)
          </div>
        </div>
      </footer>

      {/* Deal Detail Modal */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="glass-morphism border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center justify-between">
              Investment Details
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDeal(null)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedDeal && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white">
                      {selectedDeal.name}
                    </h4>
                    <p className="text-gray-400">
                      {selectedDeal.sector} • {selectedDeal.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2DD4BF]">
                      {formatCurrency(selectedDeal.currentFunding)}
                    </div>
                    <div className="text-sm text-gray-400">
                      of {formatCurrency(selectedDeal.targetFunding)} target
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white">Funding Progress</span>
                    <span className="text-[#2DD4BF]">
                      {selectedDeal.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-[#2DD4BF] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${selectedDeal.progress}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mb-2 text-white">
                    About this Investment
                  </h5>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedDeal.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-morphism p-4 rounded-xl">
                    <div className="text-sm text-gray-400">Location</div>
                    <div className="font-semibold text-white">
                      {selectedDeal.location}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedDeal.coordinates[0].toFixed(4)}°N,{" "}
                      {selectedDeal.coordinates[1].toFixed(4)}°E
                    </div>
                  </div>
                  <div className="glass-morphism p-4 rounded-xl">
                    <div className="text-sm text-gray-400">Sector</div>
                    <div className="font-semibold text-white">
                      {selectedDeal.sector}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    className="bg-[#2DD4BF] hover:bg-[#2DD4BF]/80 text-black glow-button flex-1"
                    onClick={() => setShowInvestmentModal(true)}
                  >
                    Invest Now
                  </Button>
                  <Button
                    variant="outline"
                    className="glass-morphism text-white hover:bg-white/10 border-white/10"
                  >
                    Learn More
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </DialogContent>
      </Dialog>

      {/* Investment Modal */}
      <Dialog open={showInvestmentModal} onOpenChange={setShowInvestmentModal}>
        <DialogContent className="glass-morphism border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
              New Investment
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInvestmentModal(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {selectedDeal ? (
              <div className="glass-morphism p-4 rounded-xl">
                <h4 className="font-semibold text-white">
                  {selectedDeal.name}
                </h4>
                <p className="text-sm text-gray-400">
                  {selectedDeal.sector} • {selectedDeal.location}
                </p>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-300">
                    Current funding:
                  </span>
                  <span className="text-[#2DD4BF] font-semibold">
                    {formatCurrency(selectedDeal.currentFunding)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-300 mb-4">
                  Choose from our available investment opportunities below.
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="glass-morphism p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-all"
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {deal.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {deal.sector}
                          </div>
                        </div>
                        <div className="text-[#2DD4BF] text-sm font-semibold">
                          {formatCurrency(deal.currentFunding)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDeal && (
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="investment-amount"
                    className="text-sm font-medium text-white"
                  >
                    Investment Amount (₹)
                  </Label>
                  <Input
                    id="investment-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    className="glass-morphism border-white/10 text-white mt-2"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Minimum investment: ₹10,000
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={handleInvestmentSubmit}
                    disabled={
                      !investmentAmount || parseInt(investmentAmount) < 10000
                    }
                    className="bg-[#2DD4BF] hover:bg-[#2DD4BF]/80 text-black glow-button flex-1 disabled:opacity-50"
                  >
                    Confirm Investment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInvestmentModal(false)}
                    className="glass-morphism text-white hover:bg-white/10 border-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="glass-morphism border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
              User Profile
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProfileModal(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#2DD4BF] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Rajesh Kumar
                </h3>
                <p className="text-sm text-gray-400">Investor since 2023</p>
                <p className="text-xs text-[#2DD4BF]">Premium Member</p>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-morphism p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#2DD4BF]">12</div>
                <div className="text-xs text-gray-400">Active Investments</div>
              </div>
              <div className="glass-morphism p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-[#2DD4BF]">₹8.5L</div>
                <div className="text-xs text-gray-400">Total Invested</div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Email:</span>
                <span className="text-white">rajesh.kumar@email.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Phone:</span>
                <span className="text-white">+91 XXXX-XXXX-XXXX</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Location:</span>
                <span className="text-white">Bengaluru, Karnataka</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Portfolio Value:</span>
                <span className="text-[#2DD4BF] font-semibold">₹12.3L</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="font-semibold mb-3 text-white">
                Recent Investments
              </h4>
              <div className="space-y-2">
                <div className="glass-morphism p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        Toit Brewpub
                      </div>
                      <div className="text-xs text-gray-400">2 days ago</div>
                    </div>
                    <div className="text-[#2DD4BF] text-sm font-semibold">
                      ₹50,000
                    </div>
                  </div>
                </div>
                <div className="glass-morphism p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        NextGen Software
                      </div>
                      <div className="text-xs text-gray-400">1 week ago</div>
                    </div>
                    <div className="text-[#2DD4BF] text-sm font-semibold">
                      ₹1,00,000
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button className="bg-[#2DD4BF] hover:bg-[#2DD4BF]/80 text-black glow-button flex-1">
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="glass-morphism text-white hover:bg-white/10 border-white/10"
              >
                Settings
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;

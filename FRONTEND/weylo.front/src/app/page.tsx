"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Navigation from "./components/ui/navigation";
import Footer from "./components/ui/footer";
import CountryDropdown from "./components/ui/country-dropdown";
import bgImage from "../../public/images/mainbg.png";
import { SupportedCountry } from "./types/country";

export default function Home() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] =
    useState<SupportedCountry | null>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  const handleSearch = () => {
    if (selectedCountry) {
      // Navigate to map page with country filter
      const searchParams = new URLSearchParams({
        country: selectedCountry.code,
        countryName: selectedCountry.name,
      });

      if (checkInDate) {
        searchParams.set("checkIn", checkInDate);
      }

      if (checkOutDate) {
        searchParams.set("checkOut", checkOutDate);
      }

      router.push(`/map?${searchParams.toString()}`);
    } else {
      // Navigate to map page without filter
      router.push("/map");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImage}
            alt="Beautiful landscape"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-10"></div>
        </div>
        <div className="z-10 text-center text-brown-text px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Discover the World's Beauty
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Explore unique destinations and create unforgettable memories with
            our curated travel experiences.
          </p>

          <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Destination */}
              <div className="w-full">
                <label className="block text-main-text text-sm font-semibold mb-2 text-left">
                  Destination
                </label>
                <CountryDropdown
                  onCountrySelect={setSelectedCountry}
                  selectedCountry={selectedCountry}
                  placeholder="Where to?"
                  className="w-full"
                />
              </div>

              {/* Check In */}
              <div className="w-full">
                <label className="block text-main-text text-sm font-semibold mb-2 text-left">
                  Check In
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-main-text focus:ring-2 focus:ring-yellow focus:border-transparent"
                />
              </div>

              {/* Check Out */}
              <div className="w-full">
                <label className="block text-main-text text-sm font-semibold mb-2 text-left">
                  Check Out
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-main-text focus:ring-2 focus:ring-yellow focus:border-transparent"
                  min={checkInDate}
                />
              </div>

              {/* Search Button */}
              <div className="w-full">
                <button
                  onClick={handleSearch}
                  className="w-full bg-yellow hover:bg-yellow/90 text-main-text font-bold py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedCountry}
                >
                  Explore
                </button>
              </div>
            </div>

            {/* Selected country info */}
            {selectedCountry && (
              <div className="mt-4 p-3 bg-yellow/10 rounded-lg border border-yellow/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-main-text">
                    Ready to explore <strong>{selectedCountry.name}</strong>
                  </span>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 px-4 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-main-text">
            Featured Destinations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Bali, Indonesia",
                image:
                  "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
              },
              {
                name: "Santorini, Greece",
                image:
                  "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1032&q=80",
              },
              {
                name: "Kyoto, Japan",
                image:
                  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
              },
            ].map((destination, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105"
              >
                <div className="relative h-64">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
                <div className="p-6 bg-white">
                  <h3 className="text-xl font-semibold mb-2 text-main-text">
                    {destination.name}
                  </h3>
                  <p className="text-brown-text mb-4">
                    Experience the beauty and culture of this amazing
                    destination.
                  </p>
                  <button className="text-yellow font-medium hover:text-yellow/80">
                    Explore Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Travel Packages */}
      <section className="py-16 px-4 md:px-16 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-main-text">
            Popular Travel Packages
          </h2>
          <p className="text-brown-text text-center mb-12 max-w-3xl mx-auto">
            Choose from our carefully curated travel packages designed to give
            you the best experience at affordable prices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Tropical Paradise",
                price: "$1,299",
                days: "7 Days",
                image:
                  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
              },
              {
                name: "European Adventure",
                price: "$2,499",
                days: "14 Days",
                image:
                  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
              },
              {
                name: "Cultural Journey",
                price: "$1,899",
                days: "10 Days",
                image:
                  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
              },
            ].map((packageItem, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white"
              >
                <div className="relative h-56">
                  <Image
                    src={packageItem.image}
                    alt={packageItem.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-main-text">
                      {packageItem.name}
                    </h3>
                    <span className="text-yellow font-bold">
                      {packageItem.price}
                    </span>
                  </div>
                  <p className="text-brown-text mb-4">
                    {packageItem.days} • All inclusive
                  </p>
                  <button className="w-full bg-yellow hover:bg-yellow/90 text-main-text font-medium py-2 px-4 rounded">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-main-text">
            What Our Travelers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                text: "The best travel experience I've ever had! Everything was perfectly organized.",
                image:
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
              },
              {
                name: "Michael Chen",
                text: "Amazing destinations and excellent guides. Will definitely book again!",
                image:
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
              },
              {
                name: "Emma Rodriguez",
                text: "Weylo made my dream vacation come true without any hassles.",
                image:
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-background p-6 rounded-lg shadow-md"
              >
                <div className="flex items-center mb-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                      sizes="3rem"
                    />
                  </div>
                  <h3 className="font-semibold text-main-text">
                    {testimonial.name}
                  </h3>
                </div>
                <p className="text-brown-text">"{testimonial.text}"</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 text-yellow"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 md:px-16 bg-yellow text-main-text">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Get travel inspiration, exclusive offers, and vacation tips
            delivered straight to your inbox.
          </p>
          <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
            <input
              type="email"
              placeholder="Your email address"
              className="w-full md:w-96 px-4 py-3 rounded text-main-text focus:outline-none focus:ring-2 focus:ring-yellow"
            />
            <button className="bg-white text-main-text font-medium px-6 py-3 rounded hover:bg-background transition-colors duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
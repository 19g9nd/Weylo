"use client";
import Head from "next/head";
import Image from "next/image";
import Navigation from "../components/ui/navigation";
import Footer from "../components/ui/footer";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>About Weylo - Our Story and Mission</title>
        <meta
          name="description"
          content="Learn about Weylo's mission to create unforgettable travel experiences"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
            alt="Team meeting"
            layout="fill"
            objectFit="cover"
            priority
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        <div className="z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Weylo</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Crafting unforgettable journeys since 2015
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-main-text">Our Story</h2>
              <p className="text-brown-text mb-4">
                Founded in 2015 by travel enthusiasts, Weylo began as a small 
                boutique travel agency with a big dream: to make extraordinary travel experiences 
                accessible to everyone.
              </p>
              <p className="text-brown-text mb-4">
                What started as a passion project has grown into a trusted travel platform serving 
                thousands of travelers worldwide. Our journey began when we realized that many 
                people missed out on authentic experiences because they didn't know where to look 
                or who to trust.
              </p>
              <p className="text-brown-text">
                Today, we partner with local experts in over 50 countries to bring you unique 
                adventures that respect local cultures and environments while delivering 
                unforgettable memories.
              </p>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1580541832626-2a7131ee809f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80"
                alt="Our team"
                layout="fill"
                objectFit="cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-16 px-4 md:px-16 bg-background">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-main-text">Our Mission</h2>
          <p className="text-brown-text text-xl mb-12 max-w-3xl mx-auto">
            To inspire and enable extraordinary travel experiences that create lasting memories 
            while promoting sustainable and responsible tourism.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {[
              {
                title: "Authenticity",
                description: "We believe in genuine experiences that connect you with local cultures and communities.",
                icon: (
                  <svg className="w-12 h-12 text-yellow mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                )
              },
              {
                title: "Sustainability",
                description: "We're committed to protecting the destinations we love through responsible travel practices.",
                icon: (
                  <svg className="w-12 h-12 text-yellow mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              },
              {
                title: "Excellence",
                description: "From planning to execution, we strive for perfection in every detail of your journey.",
                icon: (
                  <svg className="w-12 h-12 text-yellow mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              }
            ].map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                {value.icon}
                <h3 className="text-xl font-semibold mb-4 text-main-text">{value.title}</h3>
                <p className="text-brown-text">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 px-4 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-main-text">Meet Our Founder</h2>
          <div className="flex justify-center">
            <div className="text-center max-w-lg">
              <div className="relative h-64 w-64 mx-auto mb-4 rounded-full overflow-hidden">
                <Image
                  src="https://www.yuup.it/wp-content/uploads/2022/04/Il-pomerania-una-nuvola-di-simpatia-1024x576.png"
                  alt="19g9nd"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-main-text">19g9nd</h3>
              <p className="text-yellow font-medium mb-2">CEO & Founder</p>
              <p className="text-brown-text">
                With over 15 years in the travel industry, 19g9nd founded Weylo with a vision to make
                authentic travel experiences accessible to everyone. Her passion for sustainable tourism
                and cultural immersion drives our company's mission forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 md:px-16 bg-yellow text-main-text">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50K+", label: "Happy Travelers" },
              { number: "500+", label: "Destinations" },
              { number: "15", label: "Countries Covered" },
              { number: "98%", label: "Satisfaction Rate" }
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</p>
                <p className="text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 md:px-16 bg-background">
        <div className="max-w-4xl mx-auto text-center bg-white p-12 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-main-text">Ready to Start Your Journey?</h2>
          <p className="text-brown-text mb-8 text-xl">
            Let us help you create memories that will last a lifetime.
          </p>
          <button className="bg-yellow hover:bg-yellow/90 text-main-text font-bold py-3 px-8 rounded transition-colors duration-300">
            Explore Destinations
          </button>
        </div>
      </section>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}
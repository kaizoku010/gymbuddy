
import React, { useState } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';

interface OnboardingStackProps {
  onComplete: () => void;
}

const OnboardingStack: React.FC<OnboardingStackProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Find your ideal\ngym buddy",
      description: "Connect with like-minded fitness enthusiasts and find the perfect workout partner to achieve your goals together.",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      color: "from-orange-400 to-orange-600"
    },
    {
      title: "Stay motivated\ntogether",
      description: "Share your fitness journey, celebrate achievements, and keep each other accountable every step of the way.",
      image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Explore a fit\ncommunity",
      description: "Discover workout tips, nutrition advice, and inspiration from a supportive community of fitness lovers.",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
      color: "from-orange-600 to-pink-500"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={slides[currentSlide].image} 
          alt="Fitness background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className={`absolute inset-0 bg-gradient-to-t ${slides[currentSlide].color} opacity-60`} />
      </div>
      
      {/* Skip Button */}
      <button 
        onClick={skipOnboarding}
        className="absolute top-6 lg:top-12 right-4 lg:right-6 text-white font-medium z-10 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-black/30 transition-colors"
      >
        Skip
      </button>

      {/* Content */}
      <div className="flex flex-col justify-center items-center min-h-screen px-6 lg:px-8 py-20 relative z-10">
        {/* Title */}
        <div className="text-center mb-8 lg:mb-12 w-full max-w-4xl">
          <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 lg:mb-8 leading-tight drop-shadow-lg text-center">
            {slides[currentSlide].title.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </h1>

          {/* Description */}
          <p className="text-lg lg:text-xl xl:text-2xl text-white/90 mb-12 lg:mb-16 leading-relaxed max-w-2xl mx-auto drop-shadow-md text-center">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex space-x-3 lg:space-x-4 mb-8 lg:mb-12 justify-center">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 lg:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white w-8 lg:w-12' 
                  : 'bg-white/50 w-2 lg:w-3'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          className="bg-white text-orange-500 px-8 lg:px-12 py-4 lg:py-5 rounded-full font-semibold text-lg lg:text-xl shadow-xl hover:scale-105 transition-all duration-200 flex items-center space-x-2 lg:space-x-3"
        >
          <span>{currentSlide === slides.length - 1 ? "Let's Get Started" : "Next"}</span>
          {currentSlide === slides.length - 1 ? (
            <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
          ) : (
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default OnboardingStack;

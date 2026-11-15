export default function WhatsAppButton() {
  // 👈 CHANGE THIS to your actual WhatsApp number (with country code, no + or spaces)
  // Example for Nigeria: 2348012345678
  const phoneNumber = "2348160932630"; 
  const message = "Hello CodeSmartNG Support, I need help with my school portal.";
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-xl hover:bg-[#20bd5a] transition-transform hover:scale-110 flex items-center justify-center group"
      aria-label="Contact Support on WhatsApp"
    >
      <i className="fab fa-whatsapp text-3xl"></i>
      
      {/* Optional Tooltip on hover */}
      <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with Support
      </span>
    </a>
  );
}

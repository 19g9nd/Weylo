export default function Footer() {
  return (
    <footer className="bg-main-text text-white py-12 px-4 md:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Branding */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-yellow">Weylo</h3>
          <p className="text-white/80">
            Discover your next adventure with our curated travel experiences
            around the world.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <a href="#" className="!text-white/80">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="!text-white/80">
                Destinations
              </a>
            </li>
            <li>
              <a href="#" className="!text-white/80">
                Packages
              </a>
            </li>
            <li>
              <a href="#" className="!text-white/80">
                About Us
              </a>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold mb-4 text-white">Support</h4>
          <ul className="space-y-2">
            <li>
              <a href="#" className="!text-white/80">
                FAQ
              </a>
            </li>
            <li>
              <a href="#" className="!text-white/80">
                Contact
              </a>
            </li>
            <li>
              <a href="#" className="!text-white/80">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" className="!text-white/80">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold mb-4 text-white">Contact Us</h4>
          <address className="text-white/80 not-italic space-y-1">
            <p>123 Travel Street</p>
            <p>Adventure City, AC 12345</p>
            <p>info@weylo.com</p>
            <p>+1 (555) 123-4567</p>
          </address>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/20 text-center text-white/60">
        <p>&copy; {new Date().getFullYear()} Weylo. All rights reserved.</p>
      </div>
    </footer>
  );
}

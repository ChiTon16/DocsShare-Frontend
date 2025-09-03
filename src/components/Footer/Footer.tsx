const Footer = () => {
    return (
        <footer className="bg-white text-[#4c5966] py-10 px-6 font-[DM_Sans] border-t border-gray-300">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand / Logo */}
            <div>
              <h2 className="text-2xl font-bold text-[#2c3e50]">Yudocs</h2>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm font-semibold">
                <li><a href="#" className="hover:text-[#2c3e50] transition">About Us</a></li>
                <li><a href="#" className="hover:text-[#2c3e50] transition">Careers</a></li>
                <li><a href="#" className="hover:text-[#2c3e50] transition">Blog</a></li>
                <li><a href="#" className="hover:text-[#2c3e50] transition">Press</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm font-semibold">
                <li><a href="#" className="hover:text-[#2c3e50] transition">Help Center</a></li>
                <li><a href="#" className="hover:text-[#2c3e50] transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#2c3e50] transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#2c3e50] transition">Status</a></li>
              </ul>
            </div>

            {/* Social media */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
              <div className="flex space-x-4 text-xl font-semibold">
                <a href="#" className="hover:text-[#2c3e50] transition">🌐</a>
                <a href="#" className="hover:text-[#2c3e50] transition">🐦</a>
                <a href="#" className="hover:text-[#2c3e50] transition">📸</a>
                <a href="#" className="hover:text-[#2c3e50] transition">🎥</a>
              </div>
            </div>
          </div>

          {/* Bottom line */}
          <div className="mt-10 pt-6 text-sm text-center text-[#95a5a6] font-[DM_Sans]">
            © {new Date().getFullYear()} Yudocs. All rights reserved.
          </div>
        </footer>

    )
}

export default Footer
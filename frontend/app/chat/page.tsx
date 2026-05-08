import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ChatBox from "@/components/ChatBox";
import Footer from "@/components/Footer";

export default function page() {
  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-white overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ChatBox />
      </div>

      <Footer />
    </div>
  );
}
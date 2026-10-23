import { useEffect, useState, useRef } from "react";
import { chatApi } from "../../services/chatApi";
import { useAuth } from "../../context/AuthContext";

export default function ChatPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load contacts
  useEffect(() => {
    chatApi.contacts()
      .then(({ data }) => setContacts(data.data.contacts || []))
      .finally(() => setLoading(false));
  }, []);

  // Load history when a contact is selected
  useEffect(() => {
    if (!selected) return;
    chatApi.history(selected._id)
      .then(({ data }) => setMessages(data.data.messages || []));
  }, [selected]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected || sending) return;

    setSending(true);
    const optimisticMsg = {
      _id: "temp-" + Date.now(),
      senderId: { _id: user._id, fullName: user.fullName },
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");

    try {
      const { data } = await chatApi.send(selected._id, optimisticMsg.text);
      setMessages((prev) =>
        prev.map((m) => (m._id === optimisticMsg._id ? data.data.message : m))
      );
    } catch (err) {
      alert("Failed to send: " + (err.response?.data?.message || err.message));
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading chat…</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>

      <div className="bg-white rounded-xl shadow-sm grid grid-cols-3 h-[600px] overflow-hidden">
        {/* Sidebar: Contacts */}
        <div className="border-r overflow-y-auto">
          <div className="p-3 border-b bg-slate-50 font-semibold text-sm">
            Contacts ({contacts.length})
          </div>
          {contacts.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No contacts available</p>
          ) : (
            contacts.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelected(c)}
                className={`w-full text-left p-3 border-b hover:bg-slate-50 ${
                  selected?._id === c._id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                }`}
              >
                <div className="font-medium text-sm text-slate-800">{c.fullName}</div>
                <div className="text-xs text-slate-500 capitalize">{c.role}</div>
              </button>
            ))
          )}
        </div>

        {/* Main chat area */}
        <div className="col-span-2 flex flex-col">
          {selected ? (
            <>
              <div className="p-3 border-b bg-slate-50">
                <div className="font-semibold text-slate-800">{selected.fullName}</div>
                <div className="text-xs text-slate-500 capitalize">{selected.role}</div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 mt-10">
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId?._id === user._id || m.senderId === user._id;
                    return (
                      <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                          isMe ? "bg-blue-600 text-white" : "bg-white border text-slate-800"
                        }`}>
                          <p>{m.text}</p>
                          <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-slate-400"}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={send} className="p-3 border-t flex gap-2 bg-white">
                <input
                  type="text"
                  className="flex-1 border rounded-lg p-2 text-sm"
                  placeholder="Type a message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a contact to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

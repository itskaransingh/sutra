"use client";

import { useState } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles, MessageCircle, Search } from "lucide-react";

const suggestedQuestions = [
  "Show me patients with diabetes",
  "What did I prescribe to the patient I saw yesterday?",
  "Find patients with recurring fever",
  "List all active sessions",
];

export default function DoctorCopilotPage() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: messageText }]);
    setInput("");
    setIsLoading(true);

    // Mock response for hackathon
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm your Sutra Doctor Copilot! I can help you search across your patient records, find specific conditions, and recall past consultations. This feature will be fully powered by our agentic AI backend with RAG capabilities. 🏥",
        },
      ]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col">
      <PageHeader title="Doctor Copilot" subtitle="Search across patients" />

      <main className="flex-1 px-4 py-4 max-w-md mx-auto w-full flex flex-col">
        {messages.length === 0 ? (
          // Empty state with suggestions
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sutra-cyan/20 to-sutra-blue/20 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-sutra-cyan" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Doctor Copilot</h2>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              Search across all your patient records and past consultations
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4"
                  onClick={() => handleSend(question)}
                >
                  <MessageCircle className="w-4 h-4 mr-2 shrink-0 text-sutra-cyan" />
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          // Chat messages
          <div className="flex-1 space-y-4 overflow-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-sutra-cyan to-sutra-blue text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <Card
                  className={`max-w-[80%] ${
                    message.role === "user"
                      ? "bg-sutra-cyan text-white"
                      : "bg-muted"
                  }`}
                >
                  <CardContent className="p-3">
                    <p className="text-sm">{message.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-sutra-cyan to-sutra-blue text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-sutra-cyan rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-sutra-cyan rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-sutra-cyan rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Input area */}
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Search patients, conditions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="bg-sutra-cyan hover:bg-sutra-cyan/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </main>

      <BottomNav variant="doctor" />
    </div>
  );
}


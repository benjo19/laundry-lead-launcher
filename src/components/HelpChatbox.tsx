import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, HelpCircle, Bot } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

const predefinedQuestions = {
  sr: [
    { question: "Kako da dodam novi lead?", answer: "Idite na Lead Hunter sekciju i kliknite na 'Pretraži leadove' da pronađete nove potencijalne klijente." },
    { question: "Kako da pošaljem email?", answer: "U Email Generator sekciji možete kreirati i poslati personalizovane emailove vašim leadovima." },
    { question: "Kako da postavim podsetnik?", answer: "U CRM Reminder sekciji možete kreirati podsetnik klikom na 'Dodaj podsetnik' dugme." },
    { question: "Kako da integrisem sa Make.com?", answer: "Idite u Settings > Integracije i unesite vaš Make.com webhook URL." },
    { question: "Kako da vidim analitiku?", answer: "Analytics sekcija vam prikazuje detaljne izveštaje o performansama vaših kampanja." }
  ],
  en: [
    { question: "How to add a new lead?", answer: "Go to Lead Hunter section and click 'Search Leads' to find new potential clients." },
    { question: "How to send an email?", answer: "In Email Generator section you can create and send personalized emails to your leads." },
    { question: "How to set a reminder?", answer: "In CRM Reminder section you can create a reminder by clicking the 'Add Reminder' button." },
    { question: "How to integrate with Make.com?", answer: "Go to Settings > Integrations and enter your Make.com webhook URL." },
    { question: "How to view analytics?", answer: "Analytics section shows you detailed reports on your campaign performance." }
  ]
};

export const HelpChatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { language } = useLanguage();

  const currentQuestions = predefinedQuestions[language as keyof typeof predefinedQuestions] || predefinedQuestions.sr;

  const addMessage = (text: string, isUser: boolean, isLoading: boolean = false) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      isLoading
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessage = (id: string, text: string, isLoading: boolean = false) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, text, isLoading } : msg
    ));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue('');
    addMessage(userMessage, true);
    
    // Add loading message
    const loadingId = addMessage('...', false, true);

    try {
      console.log('Calling ai-chat function with:', { message: userMessage, language });
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: userMessage,
          language 
        }
      });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('AI chat error:', error);
        updateMessage(loadingId, language === 'en' 
          ? `Sorry, I encountered an error: ${error.message}`
          : `Izvinjavam se, dogodila se greška: ${error.message}`
        );
        return;
      }

      if (data?.response) {
        updateMessage(loadingId, data.response);
      } else {
        console.log('No response in data:', data);
        updateMessage(loadingId, language === 'en' 
          ? 'Sorry, I couldn\'t generate a response. Please try again.'
          : 'Izvinjavam se, nisam mogao da generišem odgovor. Molim pokušajte ponovo.'
        );
      }
    } catch (error) {
      console.error('Error calling AI chat:', error);
      updateMessage(loadingId, language === 'en' 
        ? `Connection error: ${error.message}. Please check your internet connection and try again.`
        : `Greška sa konekcijom: ${error.message}. Molim proverite internet konekciju i pokušajte ponovo.`
      );
    }
  };

  const handleQuestionClick = (question: string, answer: string) => {
    addMessage(question, true);
    setTimeout(() => {
      addMessage(answer, false);
    }, 300);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 h-96 shadow-lg z-50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            {language === 'en' ? 'Help Assistant' : 'Pomoćnik'}
          </CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              {language === 'en' ? 'How can I help you today?' : 'Kako mogu da vam pomognem danas?'}
            </p>
            {currentQuestions.slice(0, 3).map((item, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-auto p-2 text-left whitespace-normal"
                onClick={() => handleQuestionClick(item.question, item.answer)}
              >
                {item.question}
              </Button>
            ))}
          </div>
        )}
        
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-2 rounded-lg text-xs flex items-center gap-1 ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {!message.isUser && <Bot className="h-3 w-3" />}
                  {message.isLoading ? (
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={language === 'en' ? 'Ask a question...' : 'Postavite pitanje...'}
            className="text-xs"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} size="icon" className="h-8 w-8">
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
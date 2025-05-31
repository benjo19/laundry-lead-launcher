
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, FileText, Sparkles } from 'lucide-react';

const EmailGenerator = () => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [template, setTemplate] = useState('');

  const templates = [
    { value: 'intro', label: 'Uvodna prezentacija' },
    { value: 'follow-up', label: 'Follow-up email' },
    { value: 'proposal', label: 'Poslovni prijedlog' },
    { value: 'reminder', label: 'Podsjetnik' },
  ];

  const generateEmail = () => {
    const sampleContent = `Poštovani,

Nadamo se da ste dobro. Pišemo Vam jer vjerujemo da bi naša Marketing Agent platforma mogla značajno unaprijediti Vaš marketing pristup u industriji profesionalnih praonica rublja.

Naš sustav omogućava:
• Automatsko pronalaženje novih klijenata
• Personalizirane email kampanje
• Praćenje komunikacije s klijentima
• Automatsko generiranje sadržaja za društvene mreže

Rado bismo Vam predstavili platformu u kratkom online sastanku. Imate li vremena sljedeći tjedan?

S poštovanjem,
Vaš Marketing Agent tim`;

    setEmailContent(sampleContent);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Email Generator</h2>
          <p className="text-slate-600">Stvorite personalizirane emailove za Vaše klijente</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Predlošci
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Email Postavke
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Primatelj
              </label>
              <Input
                placeholder="email@praonica.hr"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Predložak
              </label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Odaberite predložak" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((temp) => (
                    <SelectItem key={temp.value} value={temp.value}>
                      {temp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naslov
              </label>
              <Input
                placeholder="Unesite naslov emaila"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <Button onClick={generateEmail} className="w-full bg-purple-600 hover:bg-purple-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Generiraj AI Email
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sadržaj Emaila</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Vaš email sadržaj će se pojaviti ovdje..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="min-h-64"
            />
            
            <div className="flex space-x-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" />
                Pošalji Email
              </Button>
              <Button variant="outline">
                Spremi Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nedavno Poslani Emailovi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { to: 'praonica-split@email.hr', subject: 'Uvodna prezentacija Marketing Agent', time: '2h' },
              { to: 'cistoca-zagreb@email.hr', subject: 'Follow-up našeg razgovora', time: '5h' },
              { to: 'bijelo-rublje@email.hr', subject: 'Poslovni prijedlog suradnje', time: '1d' },
            ].map((email, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-slate-900">{email.subject}</p>
                  <p className="text-sm text-slate-600">{email.to}</p>
                </div>
                <span className="text-xs text-slate-500">{email.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailGenerator;

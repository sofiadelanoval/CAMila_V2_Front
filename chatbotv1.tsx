'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ui/shadcn-io/ai/conversation';
import { Loader } from '@/components/ui/shadcn-io/ai/loader';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/shadcn-io/ai/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ui/shadcn-io/ai/prompt-input';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ui/shadcn-io/ai/reasoning';
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ui/shadcn-io/ai/source';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PaperclipIcon, RotateCcwIcon, MessageCircleIcon, Calculator, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { type FormEventHandler, useCallback, useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle} from '@/components/ui/dialog';

// Importar MathLive
// npm install mathlive
import { MathfieldElement } from 'mathlive';

type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  reasoning?: string;
  sources?: Array<{ title: string; url: string }>;
  isStreaming?: boolean;
};

const models = [
  { id: 'gpt-4o', name: '--' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B' },
];

const sampleResponses = [
  {
    content: "¡Excelente! Veo que quieres explorar matemáticas. ¿Podrías contarme qué tipo de problema o concepto matemático te interesa? Por ejemplo, ¿es álgebra, cálculo, geometría o estadística?",
    reasoning: "El usuario ha usado símbolos matemáticos, así que debo guiarle con preguntas socráticas para que explore el concepto por sí mismo.",
    sources: [
      { title: "Fundamentos de Álgebra", url: "#" },
      { title: "Introducción al Cálculo", url: "#" }
    ]
  },
  {
    content: "Interesante expresión matemática. ¿Qué crees que representa esta ecuación? ¿Puedes explicarme con tus propias palabras qué relación ves entre las variables?",
    reasoning: "Usando el método socrático para que el estudiante analice y comprenda la expresión matemática por sí mismo.",
    sources: [
      { title: "Resolución de Ecuaciones", url: "#" },
      { title: "Análisis Matemático", url: "#" }
    ]
  },
  {
    content: "Perfecto, has planteado una expresión matemática. Ahora, ¿qué pasos seguirías para resolverla? ¿Qué propiedades matemáticas podrías aplicar aquí?",
    reasoning: "Guío al estudiante para que identifique los métodos y propiedades necesarias para resolver el problema.",
    sources: [
      { title: "Métodos de Resolución", url: "#" },
      { title: "Propiedades Matemáticas", url: "#" }
    ]
  }
];

const Example = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: nanoid(),
      content: "Hola. Soy CAMila, tu Tutor Inteligente Socrático. Estoy aquí para guiarte en el desarrollo de tu razonamiento crítico y la resolución de problemas en las áreas de STEM. Mi propósito es ayudarte a profundizar en tu aprendizaje a través de preguntas, sin darte respuestas directas. Estoy lista para comenzar. ¿En qué te puedo ayudar hoy?",
      role: 'assistant',
      timestamp: new Date(),
      sources: [
        { title: "Getting Started Guide", url: "#" },
        { title: "API Documentation", url: "#" }
      ]
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState(models[0].id);
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isMathEditorOpen, setIsMathEditorOpen] = useState(false);
  
  // Refs para MathLive
  const mathfieldRef = useRef<MathfieldElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inicializar MathLive cuando se monte el componente
  useEffect(() => {
    // Importar y registrar MathLive
    import('mathlive').then(() => {
      // MathLive se registra automáticamente como custom element
    });
  }, []);

  const simulateTyping = useCallback((messageId: string, content: string, reasoning?: string, sources?: Array<{ title: string; url: string }>) => {
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const currentContent = content.slice(0, currentIndex);
          return {
            ...msg,
            content: currentContent,
            isStreaming: currentIndex < content.length,
            reasoning: currentIndex >= content.length ? reasoning : undefined,
            sources: currentIndex >= content.length ? sources : undefined,
          };
        }
        return msg;
      }));

      currentIndex += Math.random() > 0.1 ? 1 : 0;

      if (currentIndex >= content.length) {
        clearInterval(typeInterval);
        setIsTyping(false);
        setStreamingMessageId(null);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, []);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback((event) => {
    event.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: nanoid(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const responseData = sampleResponses[Math.floor(Math.random() * sampleResponses.length)];
      const assistantMessageId = nanoid();

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessageId);

      simulateTyping(assistantMessageId, responseData.content, responseData.reasoning, responseData.sources);
    }, 800);
  }, [inputValue, isTyping, simulateTyping]);

  const handleReset = useCallback(() => {
    setMessages([
      {
        id: nanoid(),
        content: "Hola. Soy CAMila, tu Tutor Inteligente Socrático. Estoy aquí para guiarte en el desarrollo de tu razonamiento crítico y la resolución de problemas en las áreas de STEM. ¿En qué te puedo ayudar hoy?",
        role: 'assistant',
        timestamp: new Date(),
        sources: [
          { title: "Getting Started Guide", url: "#" },
          { title: "API Documentation", url: "#" }
        ]
      }
    ]);
    setInputValue('');
    setIsTyping(false);
    setStreamingMessageId(null);
  }, []);

  // Función para insertar la expresión matemática
  const handleInsertMath = useCallback(() => {
    if (mathfieldRef.current && textareaRef.current) {
      const latex = mathfieldRef.current.value;
      const mathText = `$$${latex}$$`; // Formato para mostrar matemáticas
      
      // Obtener la posición actual del cursor en el textarea
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const currentValue = textareaRef.current.value;
      
      // Insertar el texto matemático en la posición del cursor
      const newValue = currentValue.slice(0, start) + mathText + currentValue.slice(end);
      setInputValue(newValue);
      
      // Cerrar el editor matemático
      setIsMathEditorOpen(false);
      
      // Limpiar el mathfield
      mathfieldRef.current.value = '';
      
      // Enfocar de vuelta el textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + mathText.length, start + mathText.length);
        }
      }, 100);
    }
  }, []);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full h-12 w-12"
            >
              <MessageCircleIcon className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] h-[550px] p-0 flex flex-col">
              <DialogTitle className="sr-only">CAMila Chat Dialog</DialogTitle>
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-500" />
                  <span className="font-medium text-sm">CAMila</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-muted-foreground text-xs">
                  {models.find(m => m.id === selectedModel)?.name}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleReset}
                className="h-8 px-2"
              >
                <RotateCcwIcon className="size-4" />
                <span className="ml-1">Reset</span>
              </Button>
            </div>

            <Conversation className="flex-1">
              <ConversationContent className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <Message from={message.role}>
                      <MessageContent>
                        {message.isStreaming && message.content === '' ? (
                          <div className="flex items-center gap-2">
                            <Loader size={14} />
                            <span className="text-muted-foreground text-sm">Thinking...</span>
                          </div>
                        ) : (
                          message.content
                        )}
                      </MessageContent>
                      <MessageAvatar 
                        src={message.role === 'user' ? 'https://github.com/dovazencot.png' : 'https://github.com/vercel.png'} 
                        name={message.role === 'user' ? 'User' : 'AI'} 
                      />
                    </Message>

                    {message.reasoning && (
                      <div className="ml-10">
                        <Reasoning isStreaming={message.isStreaming} defaultOpen={false}>
                          <ReasoningTrigger />
                          <ReasoningContent>{message.reasoning}</ReasoningContent>
                        </Reasoning>
                      </div>
                    )}

                    {message.sources && message.sources.length > 0 && (
                      <div className="ml-10">
                        <Sources>
                          <SourcesTrigger count={message.sources.length} />
                          <SourcesContent>
                            {message.sources.map((source, index) => (
                              <Source key={index} href={source.url} title={source.title} />
                            ))}
                          </SourcesContent>
                        </Sources>
                      </div>
                    )}
                  </div>
                ))}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <div className="border-t p-4">
              {/* Editor matemático */}
              {isMathEditorOpen && (
                <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Editor Matemático</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsMathEditorOpen(false)}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* MathLive mathfield */}
                    <div className="border rounded p-2 min-h-[60px] bg-background">
                      <div
                        ref={(element) => {
                          if (element && !element.querySelector('math-field')) {
                            import('mathlive').then(() => {
                              const mathField = document.createElement('math-field') as MathfieldElement;
                              mathField.style.width = '100%';
                              mathField.style.border = 'none';
                              mathField.style.fontSize = '18px';
                              mathField.style.padding = '8px';
                              mathField.style.outline = 'none';
                              
                              element.appendChild(mathField);
                              mathfieldRef.current = mathField;
                            });
                          }
                        }}
                        style={{ minHeight: '44px' }}
                      />
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsMathEditorOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleInsertMath}
                      >
                        Insertar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <PromptInput onSubmit={handleSubmit}>
                <PromptInputTextarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="¿Qué ejercicio o concepto te gustaría explorar?"
                  disabled={isTyping}
                />

                <PromptInputToolbar>
                  <PromptInputTools>
                    <PromptInputButton disabled={isTyping}>
                      <PaperclipIcon size={16} />
                    </PromptInputButton>

                    {/* Botón para abrir el editor matemático */}
                    <PromptInputButton 
                      disabled={isTyping}
                      onClick={() => setIsMathEditorOpen(!isMathEditorOpen)}
                    >
                      <Calculator size={16} />
                      <span>Math</span>
                    </PromptInputButton>

                    <PromptInputModelSelect 
                      value={selectedModel} 
                      onValueChange={setSelectedModel}
                      disabled={isTyping}
                    >
                      <PromptInputModelSelectTrigger>
                        <PromptInputModelSelectValue />
                      </PromptInputModelSelectTrigger>
                      <PromptInputModelSelectContent>
                        {models.map((model) => (
                          <PromptInputModelSelectItem key={model.id} value={model.id}>
                            {model.name}
                          </PromptInputModelSelectItem>
                        ))}
                      </PromptInputModelSelectContent>
                    </PromptInputModelSelect>
                  </PromptInputTools>

                  <PromptInputSubmit 
                    disabled={!inputValue.trim() || isTyping}
                    status={isTyping ? 'streaming' : 'ready'}
                  />
                </PromptInputToolbar>
              </PromptInput>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Example;

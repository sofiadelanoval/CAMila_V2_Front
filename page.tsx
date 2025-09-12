'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';

// Shadcn UI imports
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { AnimatedThemeToggler } from "@/components/magicui/animated-theme-toggler";

// AI Chat components
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

// Icons
import { 
  PaperclipIcon, 
  RotateCcwIcon, 
  Calculator, 
  X,
  BookOpen,
  Clock,
  CheckCircle,
  Circle,
  Play,
  Brain,
  Target,
  Award,
  User,
  ChevronRight
} from 'lucide-react';

// MathLive import
import { MathfieldElement } from 'mathlive';

// Types
type ChatMessage = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  reasoning?: string;
  sources?: Array<{ title: string; url: string }>;
  isStreaming?: boolean;
};

type Activity = {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'exercise' | 'quiz';
  status: 'completed' | 'in-progress' | 'not-started';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  content: any;
};

// Sample data
const activities: Activity[] = [
  {
    id: '1',
    title: 'Introducción a Álgebra',
    description: 'Conceptos básicos de álgebra y ecuaciones lineales',
    type: 'lesson',
    status: 'completed',
    difficulty: 'easy',
    estimatedTime: '15 min',
    content: {
      type: 'lesson',
      text: 'El álgebra es una rama de las matemáticas que utiliza símbolos y letras para representar números y cantidades en fórmulas y ecuaciones...',
    }
  },
  {
    id: '2',
    title: 'Ecuaciones Cuadráticas',
    description: 'Resolución de ecuaciones de segundo grado',
    type: 'exercise',
    status: 'in-progress',
    difficulty: 'medium',
    estimatedTime: '25 min',
    content: {
      type: 'multiple-choice',
      question: '¿Cuál es la fórmula general para resolver ecuaciones cuadráticas?',
      options: [
        'x = (-b ± √(b² - 4ac)) / 2a',
        'x = (-b ± √(b² + 4ac)) / 2a',
        'x = (b ± √(b² - 4ac)) / 2a',
        'x = (-b ± √(b² - 4ac)) / a'
      ],
      correct: 0
    }
  },
  {
    id: '3',
    title: 'Funciones Exponenciales',
    description: 'Análisis y gráficas de funciones exponenciales',
    type: 'quiz',
    status: 'not-started',
    difficulty: 'hard',
    estimatedTime: '30 min',
    content: {
      type: 'open-ended',
      question: 'Explica las principales características de una función exponencial y proporciona un ejemplo práctico de su aplicación.',
    }
  },
  {
    id: '4',
    title: 'Límites y Continuidad',
    description: 'Conceptos fundamentales de cálculo diferencial',
    type: 'lesson',
    status: 'not-started',
    difficulty: 'hard',
    estimatedTime: '40 min',
    content: {
      type: 'lesson',
      text: 'Los límites son fundamentales en el cálculo y nos permiten analizar el comportamiento de las funciones...',
    }
  },
  {
    id: '5',
    title: 'Derivadas Básicas',
    description: 'Introducción al cálculo de derivadas',
    type: 'exercise',
    status: 'not-started',
    difficulty: 'medium',
    estimatedTime: '35 min',
    content: {
      type: 'multiple-choice',
      question: '¿Cuál es la derivada de f(x) = x³?',
      options: [
        '3x²',
        'x²',
        '3x',
        'x³'
      ],
      correct: 0
    }
  }
];

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

const CamilaApp = () => {
  // States
  const [selectedActivity, setSelectedActivity] = useState<Activity>(activities[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(activities.length / 1);
  
  // Chat states
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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isMathEditorOpen, setIsMathEditorOpen] = useState(false);
  
  // Exercise states
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectValue, setSelectValue] = useState<string>('');
  const [openEndedAnswer, setOpenEndedAnswer] = useState<string>('');
  
  // Refs
  const mathfieldRef = useRef<MathfieldElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize MathLive
  useEffect(() => {
    import('mathlive').then(() => {
      // MathLive auto-registers as custom element
    });
  }, []);

  // Chat functions
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

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
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

  const handleInsertMath = useCallback(() => {
    if (mathfieldRef.current && textareaRef.current) {
      const latex = mathfieldRef.current.value;
      const mathText = `$$${latex}$$`;
      
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const currentValue = textareaRef.current.value;
      
      const newValue = currentValue.slice(0, start) + mathText + currentValue.slice(end);
      setInputValue(newValue);
      
      setIsMathEditorOpen(false);
      mathfieldRef.current.value = '';
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + mathText.length, start + mathText.length);
        }
      }, 100);
    }
  }, []);

  // Activity functions
  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setCurrentPage(activities.findIndex(a => a.id === activity.id) + 1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedActivity(activities[page - 1]);
    }
  };

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  const getDifficultyColor = (difficulty: Activity['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4" />;
      case 'exercise':
        return <Brain className="h-4 w-4" />;
      case 'quiz':
        return <Target className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const renderActivityContent = () => {
    const content = selectedActivity.content;

    switch (content.type) {
      case 'lesson':
        return (
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">{content.text}</p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Tip de CAMila</h4>
              <p className="text-blue-800 text-sm">
                Recuerda que puedes preguntarme cualquier duda sobre este tema. 
                Te ayudaré a comprenderlo mejor a través de preguntas guiadas.
              </p>
            </div>
          </div>
        );

      case 'multiple-choice':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">{content.question}</h3>
            
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una opción..." />
              </SelectTrigger>
              <SelectContent>
                {content.options.map((option: string, index: number) => (
                  <SelectItem key={index} value={index.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              className="w-full" 
              disabled={!selectValue}
            >
              Verificar Respuesta
            </Button>
          </div>
        );

      case 'open-ended':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">{content.question}</h3>
            
            <RadioGroup value={openEndedAnswer} onValueChange={setOpenEndedAnswer}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option1" id="option1" />
                  <Label htmlFor="option1">
                    Las funciones exponenciales tienen una base constante elevada a una variable
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option2" id="option2" />
                  <Label htmlFor="option2">
                    Su gráfica siempre pasa por el punto (0,1)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option3" id="option3" />
                  <Label htmlFor="option3">
                    Son útiles para modelar crecimiento o decaimiento
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option4" id="option4" />
                  <Label htmlFor="option4">
                    Todas las anteriores
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button 
              className="w-full" 
              disabled={!openEndedAnswer}
            >
              Enviar Respuesta
            </Button>
          </div>
        );

      default:
        return <p>Contenido no disponible</p>;
    }
  };

  const completedActivities = activities.filter(a => a.status === 'completed').length;
  const progressPercentage = (completedActivities / activities.length) * 100;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Left Sidebar - Activities */}
        <Sidebar variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2">
              <Award className="h-6 w-6 text-blue-600" />
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold">CAMila STEM</h2>
                <p className="text-xs text-muted-foreground">Tutor Inteligente</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {/* Progress Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Progreso General</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2 py-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Completado</span>
                    <span className="text-muted-foreground">{completedActivities}/{activities.length}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {progressPercentage.toFixed(0)}% del curso completado
                  </p>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Activities Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Actividades</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {activities.map((activity) => (
                    <SidebarMenuItem key={activity.id}>
                      <SidebarMenuButton 
                        onClick={() => handleActivitySelect(activity)}
                        isActive={selectedActivity.id === activity.id}
                        className="flex items-start gap-2 p-2"
                      >
                        <div className="flex items-center gap-2 mt-0.5">
                          {getStatusIcon(activity.status)}
                          {getTypeIcon(activity.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {activity.title}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mb-1">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs h-5 ${getDifficultyColor(activity.difficulty)}`}
                            >
                              {activity.difficulty}
                            </Badge>
                            
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {activity.estimatedTime}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {activity.description}
                          </p>
                        </div>

                        {selectedActivity.id === activity.id && (
                          <ChevronRight className="h-4 w-4 text-blue-500" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <User className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Estudiante</span>
                    <span className="text-xs text-muted-foreground">m@ucaribe.edu.mx</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header with Sidebar Trigger */}
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-6" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Curso STEM</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">{selectedActivity.title}</span>
            </div>

            <div className="ml-auto">
              <AnimatedThemeToggler />
            </div>
          </header>

          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Center Panel - Activity Content */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="h-full flex flex-col p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(selectedActivity.type)}
                    <h1 className="text-2xl font-bold">{selectedActivity.title}</h1>
                    <Badge 
                      variant="secondary" 
                      className={getDifficultyColor(selectedActivity.difficulty)}
                    >
                      {selectedActivity.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {selectedActivity.estimatedTime}
                  </div>
                </div>

                <Card className="flex-1 mb-6">
                  <CardHeader>
                    <CardDescription>{selectedActivity.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderActivityContent()}
                  </CardContent>
                </Card>

                {/* Pagination */}
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel - CAMila Chat */}
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full flex flex-col border-l bg-background">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-green-500" />
                      <span className="font-medium text-sm">CAMila</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
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

                {/* Chat Conversation */}
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

                {/* Chat Input */}
                <div className="border-t p-4">
                  {/* Math Editor */}
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
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CamilaApp;
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Car, TrendingUp, Shield, Zap } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-6 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Gestão de Frota{" "}
              <span className="gradient-text">Inteligente</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Controle completo de veículos, contratos e finanças em uma plataforma moderna e automatizada
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/auth">
                <Button size="lg" className="glow-primary text-lg px-8 py-6 rounded-xl">
                  <Zap className="mr-2 h-5 w-5" />
                  Entrar no Sistema
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl glass">
                Saber Mais
              </Button>
            </div>

            {/* Car Animation */}
            <div className="relative h-32 mt-16 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Car className="w-24 h-24 text-primary animate-car-drive" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Por que escolher Capital Ramos?</h2>
            <p className="text-xl text-muted-foreground">Tecnologia de ponta para gestão eficiente</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "ROI em Tempo Real",
                description: "Acompanhe lucro, payback e retorno de investimento de cada veículo automaticamente",
                color: "text-success"
              },
              {
                icon: Shield,
                title: "Contratos Digitais",
                description: "Geração automática de contratos com assinatura digital via Autentique",
                color: "text-primary"
              },
              {
                icon: Zap,
                title: "Automação Total",
                description: "WhatsApp, e-mail e notificações automáticas para clientes e equipe",
                color: "text-accent"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="glass-card p-8 hover:scale-105 transition-smooth animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color === 'text-success' ? 'from-success/20 to-success/5' : feature.color === 'text-primary' ? 'from-primary/20 to-primary/5' : 'from-accent/20 to-accent/5'} flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10" />
        <div className="container mx-auto px-6 relative">
          <div className="glass-card p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">
              Pronto para transformar sua gestão?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Comece agora e tenha controle total da sua frota em minutos
            </p>
            <Link to="/auth">
              <Button size="lg" className="glow-primary text-lg px-12 py-6 rounded-xl">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold gradient-text">Capital Ramos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Gestão inteligente de frotas
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-smooth">Termos</a>
              <a href="#" className="hover:text-primary transition-smooth">Privacidade</a>
              <a href="#" className="hover:text-primary transition-smooth">Suporte</a>
              <a href="https://wa.me/5511999999999" className="hover:text-success transition-smooth">WhatsApp</a>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-muted-foreground">
            © 2025 Capital Ramos. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

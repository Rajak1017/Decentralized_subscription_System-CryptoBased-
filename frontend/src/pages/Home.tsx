import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import heroBackground from '../assets/hero-bg.jpg';
import { useEffect, useState } from 'react';
import { fetchStats } from '../lib/api';

const features = [
  {
    icon: Shield,
    title: 'Decentralized & Secure',
    description: 'Built on blockchain technology ensuring transparency and security for all transactions.',
  },
  {
    icon: Zap,
    title: 'Instant Activation',
    description: 'Subscribe with crypto and get instant access to premium features without delays.',
  },
  {
    icon: Users,
    title: 'Community Driven',
    description: 'Join a growing community of users leveraging Web3 for subscription services.',
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Access from anywhere in the world with just your wallet - no geographic restrictions.',
  },
];

type Stat = { label: string; value: string };

export default function Home() {
  const [stats, setStats] = useState<Stat[]>([
    { label: 'Active Users', value: '—' },
    { label: 'Subscriptions', value: '—' },
    { label: 'Active Plans', value: '—' },
    { label: 'Uptime', value: '99.9%' },
  ]);

  useEffect(() => {
    fetchStats()
      .then((s) => {
        setStats([
          { label: 'Active Users', value: String(s.activeUsers) },
          { label: 'Subscriptions', value: String(s.subscriptions) },
          { label: 'Active Plans', value: String(s.activePlans) },
          { label: 'Uptime', value: '99.9%' },
        ]);
      })
      .catch(() => {
        // keep defaults on error
      });
  }, []);
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 dark:opacity-60"
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-background/90 dark:bg-background/80 backdrop-blur-sm" />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative container mx-auto px-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              The Future of
              <br />
              <span className="text-gradient">Decentralized</span>
              <br />
              Subscriptions
            </motion.h1>
            
            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Subscribe to premium services using cryptocurrency. 
              Transparent, secure, and completely decentralized.
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Link to="/plans">
                <Button size="lg" className="btn-gradient text-lg px-8 py-4">
                  Explore Plans
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <Button
                size="lg"
                variant="outline"
                className="border-neon-cyan/30 hover:border-neon-cyan/50 text-lg px-8 py-4"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 rounded-full bg-neon-cyan/10 dark:bg-neon-cyan/20 blur-xl"
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-20 w-32 h-32 rounded-full bg-neon-purple/10 dark:bg-neon-purple/20 blur-xl"
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Why Choose <span className="text-gradient">SubDAO</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of subscription services powered by blockchain technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
              >
                <Card className="card-gradient p-6 h-full text-center">
                  <div className="mb-4 inline-flex p-3 rounded-xl bg-gradient-primary">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-neon-cyan/5 to-neon-purple/5 dark:from-primary/10 dark:via-neon-cyan/5 dark:to-neon-purple/10">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users already using decentralized subscriptions
            </p>
            <Link to="/plans">
              <Button size="lg" className="btn-gradient text-lg px-8 py-4">
                View All Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
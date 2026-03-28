import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { ConceptArtGallery } from '@/entities';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Image } from '@/components/ui/image';
import { Calendar, User } from 'lucide-react';

export default function GaleriaPage() {
  const [artworks, setArtworks] = useState<ConceptArtGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    try {
      const result = await BaseCrudService.getAll<ConceptArtGallery>('conceptart');
      setArtworks(result.items);
    } catch (error) {
      console.error('Error loading artworks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-custom4/30 to-background">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <h1 className="font-heading text-6xl lg:text-8xl uppercase tracking-wider text-foreground">
              Galeria <span className="text-primary">Visual</span>
            </h1>
            <p className="font-paragraph text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
              Explore o universo visual de Domínio do Comando através de arte conceitual em estilo cartoon cinematográfico ultra realista
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
          <div className="min-h-[800px]">
            {isLoading ? null : artworks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {artworks.map((artwork, index) => (
                  <motion.div
                    key={artwork._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="bg-custom4/30 border border-secondary/20 rounded-lg overflow-hidden hover:border-primary/50 transition-all">
                      {artwork.artworkImage && (
                        <div className="relative h-80 overflow-hidden">
                          <Image
                            src={artwork.artworkImage}
                            alt={artwork.artworkTitle || 'Concept art'}
                            width={600}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-custom4 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      
                      <div className="p-6 space-y-4">
                        {artwork.artworkTitle && (
                          <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {artwork.artworkTitle}
                          </h3>
                        )}
                        
                        {artwork.artworkDescription && (
                          <p className="font-paragraph text-base text-foreground/80 leading-relaxed">
                            {artwork.artworkDescription}
                          </p>
                        )}
                        
                        <div className="pt-4 border-t border-secondary/20 space-y-2">
                          {artwork.artistName && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-secondary" />
                              <p className="font-paragraph text-sm text-foreground/70">
                                {artwork.artistName}
                              </p>
                            </div>
                          )}
                          
                          {artwork.dateCreated && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-secondary" />
                              <p className="font-paragraph text-sm text-foreground/70">
                                {formatDate(artwork.dateCreated)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="font-paragraph text-xl text-foreground/60">
                  Nova arte conceitual em breve
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Horizontal Carousel Section - Inspired by the image */}
      {artworks.length > 0 && (
        <section className="py-16 bg-custom4/20">
          <div className="max-w-[120rem] mx-auto px-6 lg:px-12">
            <motion.h2
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-heading text-4xl uppercase tracking-wider text-foreground mb-8"
            >
              Destaques da <span className="text-primary">Galeria</span>
            </motion.h2>
            
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6" style={{ width: 'max-content' }}>
                {artworks.slice(0, 6).map((artwork, index) => (
                  <motion.div
                    key={artwork._id}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="w-80 flex-shrink-0"
                  >
                    {artwork.artworkImage && (
                      <div className="relative h-64 overflow-hidden rounded-lg border-2 border-secondary/30 hover:border-primary/50 transition-all">
                        <Image
                          src={artwork.artworkImage}
                          alt={artwork.artworkTitle || 'Concept art'}
                          width={400}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        />
                        {artwork.artworkTitle && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent p-4">
                            <p className="font-heading text-lg uppercase tracking-wider text-foreground">
                              {artwork.artworkTitle}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

/**
 * Compatibilidade temporária.
 *
 * A loja antiga de "animações grátis" usava convoyAnimationStore e NÃO alimentava
 * o ataque real. O sistema novo usa comboios comprados/equipados pelo backend
 * via playerConvoyStore. Mantemos este arquivo apenas para qualquer import antigo
 * cair na loja correta.
 */
import ConvoyShop from '@/components/shop/ConvoyShop';

export default function ConvoyAnimationShop() {
  return <ConvoyShop />;
}

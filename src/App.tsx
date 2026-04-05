// src/App.tsx
import { useState,useEffect } from 'react';
import { Plus } from 'lucide-react'; // <-- Importe o ícone de +
import { BottomNav } from './components/BottomNav';
import { Home } from './components/Home';
import { AddRideModal } from './components/AddRideModal'; // <-- Importe o Modal
import { Viagens } from './components/Viagens';
import { AddFriendModal } from './components/AddFriendModal'; 
import { Amigos } from './components/Amigos';
import { Perfil } from './components/Perfil';
import { dbService } from './services/database';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  // Estado para controlar a abertura do modal
  const [isRideModalOpen, setIsRideModalOpen] = useState(false); // 🟢 Renomeei para ficar mais claro
  const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  
  const refreshData = () => {
    setDataVersion(prev => prev + 1);
  };
  const handleFabClick = () => {
    if (activeTab === 'amigos') {
      setIsFriendModalOpen(true); // Se tiver na tela de amigos, abre o de amigos
    } else {
      setIsRideModalOpen(true); // Se tiver na home ou viagens, abre o de corrida
    }
  };

  useEffect(() => {
    const verificarNotificacaoMensal = async () => {
      // 1. Pega as configurações para saber se as notificações estão ligadas
      const config = await dbService.settings.get();
      if (!config.notificacoes || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const hoje = new Date();
      const diaAtual = hoje.getDate();
      
      // Descobre quantos dias tem o mês atual
      const ultimoDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();

      // Checa se faltam 3 dias ou menos para o fim do mês (ex: dia 28, 29, 30 ou 31)
      if (ultimoDiaDoMes - diaAtual <= 3) {
        
        // Verifica no localStorage se já enviamos a notificação neste mês
        const chaveNotificacao = `notificacao_enviada_${hoje.getFullYear()}_${hoje.getMonth()}`;
        const jaEnviou = localStorage.getItem(chaveNotificacao);

        if (!jaEnviou) {
          // Dispara a Notificação Push Nativa
          new Notification('Racha Uber: Hora da Cobrança!', {
            body: 'O mês está acabando. Que tal dar uma olhada em quem está te devendo e enviar os lembretes?',
            icon: '/icon.png', // Opcional: Se você tiver um ícone do app
            badge: '/icon.png',
            vibrate: [200, 100, 200] // Faz o celular vibrar
          }as any);

          // Marca que já enviou para não ficar enchendo o saco do usuário toda hora que ele abrir o app
          localStorage.setItem(chaveNotificacao, 'true');
        }
      }
    };

    verificarNotificacaoMensal();
  }, [dataVersion]);

  return (
    <div className="min-h-screen bg-[#05080f] text-white font-sans relative pb-20">
      
      <main className="p-4">
        {activeTab === 'home' && <Home key={`home-${dataVersion}`} />}
        {activeTab === 'viagens' && <Viagens key={`viagens-${dataVersion}`} />}
        {activeTab === 'amigos' && <Amigos key={`amigos-${dataVersion}`} onDataChange={refreshData} />}
        {activeTab === 'perfil' && <Perfil onDataChange={refreshData} />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 🟢 4. O BOTÃO ATUALIZADO */}
      {(activeTab === 'home' || activeTab === 'viagens' || activeTab === 'amigos') && (
        <button 
          onClick={handleFabClick}
          className="fixed bottom-20 right-6 w-14 h-14 bg-[#2DD4BF] hover:bg-[#25b5a3] rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30 transition-transform hover:scale-105 active:scale-95 z-40"
        >
          <Plus size={32} className="text-[#05080f] stroke-[2.5px]" />
        </button>
      )}

      {/* MODAL DE CORRIDA */}
      <AddRideModal 
        isOpen={isRideModalOpen} 
        onClose={() => setIsRideModalOpen(false)} 
        onSuccess={refreshData}
      />

      {/* MODAL DE AMIGO */}
      <AddFriendModal 
        isOpen={isFriendModalOpen} 
        onClose={() => setIsFriendModalOpen(false)} 
        onSuccess={refreshData} // Agora ele vai aumentar o dataVersion!
      />
      
    </div>
  );
}

export default App;
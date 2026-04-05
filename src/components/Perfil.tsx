// src/components/Perfil.tsx
import { useState, useEffect } from 'react';
import { User, QrCode, Bell, Trash2, Save, LoaderCircle, ShieldCheck } from 'lucide-react';
import { dbService } from '../services/database';

interface PerfilProps {
  onDataChange: () => void;
}

export function Perfil({ onDataChange }: PerfilProps) {
  const [nome, setNome] = useState('');
  const [pix, setPix] = useState('');
  const [notificacoes, setNotificacoes] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const carregarConfiguracoes = async () => {
      const config = await dbService.settings.get();
      setNome(config.nome);
      setPix(config.pix);
      setNotificacoes(config.notificacoes);
      setIsLoading(false);
    };
    carregarConfiguracoes();
  }, []);

  const handleToggleNotificacoes = async () => {
    const novoStatus = !notificacoes;
    
    // Se o usuário está ligando as notificações, pedimos permissão ao celular
    if (novoStatus === true) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Você precisa permitir as notificações no seu navegador/celular para usar este recurso.');
          return; // Se ele negar, não muda o botão
        }
      } else {
        alert('Seu navegador não suporta notificações.');
        return;
      }
    }
    
    setNotificacoes(novoStatus);
  };

  const handleSalvar = async () => {
    setIsSaving(true);
    await dbService.settings.save({ nome, pix, notificacoes });
    setIsSaving(false);
    onDataChange(); // Avisa o App para recarregar tudo (atualiza a Home)
    alert("Perfil atualizado com sucesso!");
  };

  const handleResetarApp = async () => {
    if (window.confirm("🚨 ATENÇÃO: Isso vai apagar todas as seus rachas e amigos. Tem certeza?")) {
      await dbService.settings.clearAllData();
      onDataChange();
      alert("Aplicativo resetado. Atualize a página.");
      window.location.reload();
    }
  };

  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoaderCircle size={40} className="animate-spin text-[#2DD4BF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="mt-2">
        <h1 className="text-3xl font-bold text-white mb-2">Seu Perfil</h1>
        <p className="text-gray-500 text-sm">Gerencie seus dados e preferências</p>
      </header>

      {/* Seção de Dados Pessoais */}
      <section className="bg-[#1c1c1e] rounded-3xl p-5 border border-white/5 space-y-5">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#2DD4BF]" />
          Dados de Cobrança
        </h2>

        <div>
          <label className="block text-gray-400 text-xs mb-2 uppercase font-bold tracking-wider">Como seus amigos te chamam</label>
          <div className="bg-[#2c2c2e] rounded-xl p-3 flex items-center text-white focus-within:ring-1 focus-within:ring-[#2DD4BF]">
            <User size={18} className="text-gray-400 mr-3" />
            <input 
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-transparent w-full outline-none text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-2 uppercase font-bold tracking-wider">Sua Chave Pix Principal</label>
          <div className="bg-[#2c2c2e] rounded-xl p-3 flex items-center text-white focus-within:ring-1 focus-within:ring-[#2DD4BF]">
            <QrCode size={18} className="text-gray-400 mr-3" />
            <input 
              type="text" 
              value={pix}
              onChange={(e) => setPix(e.target.value)}
              placeholder="CPF, E-mail ou Celular"
              className="bg-transparent w-full outline-none text-white"
            />
          </div>
          <p className="text-gray-500 text-[10px] mt-2">Esta chave será enviada automaticamente nas cobranças via WhatsApp.</p>
        </div>

        <button 
          onClick={handleSalvar}
          disabled={isSaving}
          className="w-full bg-[#2DD4BF] hover:bg-[#25b5a3] text-[#05080f] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <LoaderCircle className="animate-spin" size={20} /> : <Save size={20} />}
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </section>

      {/* Seção de Preferências do App */}
      <section className="bg-[#1c1c1e] rounded-3xl p-5 border border-white/5">
        <h2 className="text-white font-semibold mb-4">Preferências</h2>
        
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#2c2c2e] p-2 rounded-lg"><Bell size={18} className="text-gray-300" /></div>
            <div>
              <p className="text-white text-sm font-medium">Lembretes de Cobrança</p>
              <p className="text-gray-500 text-xs">Notificar rachas pendentes</p>
            </div>
          </div>
          {/* Toggle Button falso estilo iOS */}
          <button 
            onClick={handleToggleNotificacoes}
            className={`w-12 h-6 rounded-full transition-colors relative ${notificacoes ? 'bg-[#34C759]' : 'bg-gray-600'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${notificacoes ? 'right-0.5' : 'left-0.5'}`}></div>
          </button>
        </div>
      </section>

      {/* Zona de Perigo */}
      <section className="pt-4">
        <button 
          onClick={handleResetarApp}
          className="w-full border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 size={18} />
          Apagar todos os dados do App
        </button>
      </section>
    </div>
  );
}
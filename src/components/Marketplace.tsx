import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ShoppingBag, X, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/ui';
import { useToast } from '../context/ToastContext';

const PRODUCTS_DB: Product[] = [
    { id: 1, name: 'Ração Premium Adulto', category: 'food', price: 149.90, stock_quantity: 10, image: 'https://images.unsplash.com/photo-1589924691195-41432c84c161?auto=format&fit=crop&w=400&q=80', description: 'Sabor Frango.' },
    { id: 2, name: 'Mordedor Resistente', category: 'toys', price: 39.90, stock_quantity: 10, image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=400&q=80', description: 'Borracha natural.' },
    { id: 3, name: 'Shampoo Hipoalergênico', category: 'hygiene', price: 45.00, stock_quantity: 10, image: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?auto=format&fit=crop&w=400&q=80', description: 'Aveia. 500ml.' },
    { id: 4, name: 'Coleira de Couro', category: 'accessories', price: 89.90, stock_quantity: 10, image: 'https://images.unsplash.com/photo-1605631088190-799d5eb6cc5e?auto=format&fit=crop&w=400&q=80', description: 'Tamanho M.' }
];

export const Marketplace: React.FC = () => {
  const [cart, setCart] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('petspa_cart');
    if (saved) setCart(JSON.parse(saved));
  }, []);

  const addToCart = (p: Product) => {
    const newCart = [...cart, p];
    setCart(newCart);
    localStorage.setItem('petspa_cart', JSON.stringify(newCart));
    setIsCartOpen(true);
    toast.success('Produto adicionado à sacola!');
  };

  const removeFromCart = (idx: number) => {
    const newCart = [...cart];
    newCart.splice(idx, 1);
    setCart(newCart);
    localStorage.setItem('petspa_cart', JSON.stringify(newCart));
  };

  const filtered = category === 'all' ? PRODUCTS_DB : PRODUCTS_DB.filter(p => p.category === category);
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = () => {
    toast.success('Pedido realizado com sucesso! 🎉');
    setCart([]);
    localStorage.removeItem('petspa_cart');
    setIsCartOpen(false);
  };

  return (
    <div className="container" style={{ paddingTop: 20 }}>
      <div className="market-header scroll-hidden scroll-visible">
        <div>
           <h2>Pet Shop</h2>
           <p>Mimos e cuidados para levar pra casa.</p>
        </div>
        <button className="btn btn-secondary btn-cart-trigger" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
           <ShoppingBag />
           {cart.length > 0 && <span id="cart-count-badge">{cart.length}</span>}
        </button>
      </div>

      <div className="category-filters scroll-hidden delay-100 scroll-visible" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
         {['all', 'food', 'toys', 'hygiene'].map(cat => (
           <button key={cat} className={`filter-btn ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
             {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
           </button>
         ))}
      </div>

      <div className="product-grid">
         {filtered.map((p, idx) => (
           <div key={p.id} className="card product-card scroll-visible">
             <div className="product-img-wrapper">
               <img src={p.image} alt={p.name} className="product-img" />
               <span className="product-cat-badge">{p.category}</span>
             </div>
             <div className="product-info">
               <h4 className="product-title">{p.name}</h4>
               <p className="product-desc">{p.description}</p>
               <div className="product-bottom">
                 <strong className="product-price">{formatCurrency(p.price)}</strong>
                 <button className="btn-add-cart" onClick={() => addToCart(p)}><Plus size={18}/></button>
               </div>
             </div>
           </div>
         ))}
      </div>

      {/* Cart Sidebar */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)} />
      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`} id="cart-sidebar">
         <div className="cart-header">
           <h3>Seu Carrinho</h3>
           <button className="btn-icon-sm" onClick={() => setIsCartOpen(false)}><X /></button>
         </div>
         <div className="cart-items">
           {cart.length === 0 ? (
             <div className="empty-cart"><ShoppingCart size={40} /><p>Vazio</p></div>
           ) : (
             cart.map((item, i) => (
               <div key={i} className="cart-item">
                  <img src={item.image} className="cart-item-img" alt="" />
                  <div className="cart-item-info">
                     <div className="cart-item-title">{item.name}</div>
                     <div className="cart-item-price">{formatCurrency(item.price)}</div>
                  </div>
                  <button className="btn-remove-item" onClick={() => removeFromCart(i)}><Trash2 size={16}/></button>
               </div>
             ))
           )}
         </div>
         <div className="cart-footer">
            <div className="cart-total-row"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
            <button className="btn btn-primary" disabled={cart.length === 0} onClick={handleCheckout}>Finalizar Compra</button>
         </div>
      </div>
    </div>
  );
};
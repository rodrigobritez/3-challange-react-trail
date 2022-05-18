import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart];
      const amountUpdate = updateCart.find(
        (product) => product.id === productId
      );
      const stock = await api.get(`/stock/${productId}`);
      if (amountUpdate) {
        if (stock.data.amount <= amountUpdate.amount) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        } else {
          amountUpdate.amount += 1;
          setCart(updateCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
          return;
        }
      }
      const productUpdate = await api.get<Product>(`/products/${productId}`);
      const data = {
        ...productUpdate.data,
        amount: 1,
      };
      updateCart.push(data);
      setCart([...cart, data]);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart];
      const productRemove = updateCart.findIndex(
        (product) => product.id === productId
      );
      if (productRemove > 0) {
        updateCart.splice(productRemove, 1);
        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      }
      throw new Error();
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updateCart = [...cart];
      const stock = await api.get(`/stock/${productId}`);
      const productFind = updateCart.find(
        (product) => product.id === productId
      );

      if (productFind) {
        {
          if (stock.data.amount < amount) {
            toast.error("Quantidade solicitada fora de estoque");
          } else {
            productFind.amount = amount;
            setCart(updateCart);
            localStorage.setItem(
              "@RocketShoes:cart",
              JSON.stringify(updateCart)
            );
          }
        }
      } else throw new Error();
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

import bcrypt from 'bcryptjs';
import Inventory from '../models/Inventory.js';
import Pizza from '../models/Pizza.js';
import User from '../models/User.js';

const seedData = async () => {
  try {
    // 1. Seed Inventory
    const inventoryCount = await Inventory.countDocuments();
    if (inventoryCount === 0) {
      console.log('Seeding inventory items...');
      const ingredients = [
        // Bases
        { category: 'base', name: 'Thin Crust', stock: 50, price: 80, threshold: 20 },
        { category: 'base', name: 'Thick Crust', stock: 50, price: 90, threshold: 20 },
        { category: 'base', name: 'Cheese Burst', stock: 50, price: 150, threshold: 20 },
        { category: 'base', name: 'Gluten-Free', stock: 50, price: 130, threshold: 20 },
        { category: 'base', name: 'Whole Wheat', stock: 50, price: 100, threshold: 20 },

        // Sauces
        { category: 'sauce', name: 'Classic Tomato', stock: 50, price: 30, threshold: 20 },
        { category: 'sauce', name: 'Spicy Marinara', stock: 50, price: 35, threshold: 20 },
        { category: 'sauce', name: 'BBQ Sauce', stock: 50, price: 40, threshold: 20 },
        { category: 'sauce', name: 'Basil Pesto', stock: 50, price: 45, threshold: 20 },
        { category: 'sauce', name: 'Creamy Garlic', stock: 50, price: 40, threshold: 20 },

        // Cheese
        { category: 'cheese', name: 'Mozzarella', stock: 50, price: 60, threshold: 20 },
        { category: 'cheese', name: 'Cheddar', stock: 50, price: 70, threshold: 20 },
        { category: 'cheese', name: 'Parmesan', stock: 50, price: 80, threshold: 20 },
        { category: 'cheese', name: 'Vegan Cheese', stock: 50, price: 90, threshold: 20 },

        // Veggies
        { category: 'veggie', name: 'Onion', stock: 50, price: 20, threshold: 15 },
        { category: 'veggie', name: 'Capsicum', stock: 50, price: 20, threshold: 15 },
        { category: 'veggie', name: 'Tomato', stock: 50, price: 20, threshold: 15 },
        { category: 'veggie', name: 'Jalapenos', stock: 50, price: 25, threshold: 15 },
        { category: 'veggie', name: 'Mushrooms', stock: 50, price: 30, threshold: 15 },
        { category: 'veggie', name: 'Black Olives', stock: 50, price: 25, threshold: 15 },

        // Meats
        { category: 'meat', name: 'Pepperoni', stock: 50, price: 80, threshold: 15 },
        { category: 'meat', name: 'Grilled Chicken', stock: 50, price: 70, threshold: 15 },
        { category: 'meat', name: 'Italian Sausage', stock: 50, price: 75, threshold: 15 },
        { category: 'meat', name: 'Smoked Bacon', stock: 50, price: 85, threshold: 15 },
      ];
      await Inventory.insertMany(ingredients);
      console.log('Inventory seeded successfully.');
    }

    // 2. Seed Predefined Pizzas
    const pizzaCount = await Pizza.countDocuments();
    if (pizzaCount === 0) {
      console.log('Seeding preconfigured pizzas...');
      const pizzas = [
        {
          name: 'Margherita Classic',
          description: 'A timeless Italian favorite with tomato sauce, mozzarella cheese, and fresh basil leaves.',
          price: 250,
          image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=600&q=80',
          base: 'Thin Crust',
          sauce: 'Classic Tomato',
          cheese: 'Mozzarella',
          veggies: ['Tomato'],
          meats: [],
        },
        {
          name: 'Double Cheese Burst',
          description: 'Loaded with a gooey cheese filling in the crust and double mozzarella topping.',
          price: 380,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
          base: 'Cheese Burst',
          sauce: 'Classic Tomato',
          cheese: 'Mozzarella',
          veggies: [],
          meats: [],
        },
        {
          name: 'Veggie Supreme',
          description: 'Abundance of colorful bell peppers, crisp onions, earthy mushrooms, and black olives.',
          price: 320,
          image: 'https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=600&q=80',
          base: 'Whole Wheat',
          sauce: 'Spicy Marinara',
          cheese: 'Cheddar',
          veggies: ['Onion', 'Capsicum', 'Mushrooms', 'Black Olives'],
          meats: [],
        },
        {
          name: 'BBQ Chicken Deluxe',
          description: 'Sweet and smoky BBQ sauce base topped with grilled chicken chunks, onions, and cheese.',
          price: 420,
          image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80',
          base: 'Thin Crust',
          sauce: 'BBQ Sauce',
          cheese: 'Mozzarella',
          veggies: ['Onion'],
          meats: ['Grilled Chicken'],
        },
        {
          name: 'Pepperoni Feast',
          description: 'A classic favorite loaded with premium sliced pepperoni and melted mozzarella cheese.',
          price: 390,
          image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80',
          base: 'Thick Crust',
          sauce: 'Classic Tomato',
          cheese: 'Mozzarella',
          veggies: [],
          meats: ['Pepperoni'],
        },
      ];
      await Pizza.insertMany(pizzas);
      console.log('Pizzas seeded successfully.');
    }

    // 3. Seed Admin and User accounts
    const adminExists = await User.findOne({ email: 'admin@pizza.com' });
    if (!adminExists) {
      console.log('Creating default admin account...');
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Pizza Admin',
        email: 'admin@pizza.com',
        password: adminPasswordHash,
        role: 'admin',
        isVerified: true,
      });
      console.log('Admin account created: admin@pizza.com / admin123');
    }

    const userExists = await User.findOne({ email: 'user@pizza.com' });
    if (!userExists) {
      console.log('Creating default user account...');
      const userPasswordHash = await bcrypt.hash('user123', 10);
      await User.create({
        name: 'John Doe',
        email: 'user@pizza.com',
        password: userPasswordHash,
        role: 'user',
        isVerified: true,
      });
      console.log('User account created: user@pizza.com / user123');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

export default seedData;

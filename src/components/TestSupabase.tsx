import React from 'react';
import { resellerService } from '../services/resellers';
import { supabase } from '../lib/supabase';
import type { NewReseller } from '../types/database.types';

export function TestSupabase() {
  // Función para iniciar sesión
  const login = async () => {
    try {
      // Intentar crear el usuario primero
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'andreschmde@gmail.com',
        password: 'Jacg120603@'
      });

      if (signUpError && !signUpError.message.includes('User already registered')) {
        throw signUpError;
      }

      // Si el usuario ya existe o se creó correctamente, intentamos iniciar sesión
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'andreschmde@gmail.com',
        password: 'Jacg120603@'
      });

      if (signInError) throw signInError;
      
      console.log('Sesión iniciada:', signInData);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  // Función para probar la creación
  const testCreate = async () => {
    try {
      const newReseller: NewReseller = {
        full_name: 'Test Reseller',
        company_name: 'Test Company',
        email: `test${Date.now()}@example.com`,
        phone: '1234567890',
        plan: 'basic',
        subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días desde ahora
        status: 'active',
        total_clients: 0
      };

      const created = await resellerService.create(newReseller);
      console.log('Revendedor creado:', created);
    } catch (error) {
      console.error('Error al crear:', error);
    }
  };

  // Función para probar la obtención de todos
  const testGetAll = async () => {
    try {
      const resellers = await resellerService.getAll();
      console.log('Todos los revendedores:', resellers);
    } catch (error) {
      console.error('Error al obtener:', error);
    }
  };

  // Función para probar la búsqueda
  const testSearch = async () => {
    try {
      const results = await resellerService.search('test');
      console.log('Resultados de búsqueda:', results);
    } catch (error) {
      console.error('Error al buscar:', error);
    }
  };

  // Función para probar la actualización
  const testUpdate = async () => {
    try {
      const resellers = await resellerService.getAll();
      if (resellers.length > 0) {
        const firstReseller = resellers[0];
        const updated = await resellerService.update(firstReseller.id, {
          company_name: 'Updated Company ' + Date.now()
        });
        console.log('Revendedor actualizado:', updated);
      } else {
        console.log('No hay revendedores para actualizar');
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  // Función para probar la eliminación
  const testDelete = async () => {
    try {
      const resellers = await resellerService.getAll();
      if (resellers.length > 0) {
        await resellerService.delete(resellers[0].id);
        console.log('Revendedor eliminado');
      } else {
        console.log('No hay revendedores para eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold mb-4">Pruebas de Supabase</h2>
      <div className="space-x-4">
        <button
          onClick={login}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 mb-4 block"
        >
          Iniciar Sesión (admin@xtream.com)
        </button>
        <button
          onClick={testCreate}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Crear Revendedor
        </button>
        <button
          onClick={testGetAll}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Obtener Todos
        </button>
        <button
          onClick={testSearch}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Buscar 'test'
        </button>
        <button
          onClick={testUpdate}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Actualizar Primero
        </button>
        <button
          onClick={testDelete}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Eliminar Primero
        </button>
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground">
          Abre la consola del navegador (F12) para ver los resultados
        </p>
      </div>
    </div>
  );
}

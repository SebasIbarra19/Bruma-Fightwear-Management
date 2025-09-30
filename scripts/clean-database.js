// Script para limpiar completamente la base de datos
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanDatabase() {
  console.log('🧹 LIMPIEZA COMPLETA DE LA BASE DE DATOS')
  console.log('=' .repeat(50))
  
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
  
  try {
    // 1. Eliminar TODAS las asignaciones
    console.log('\n🗑️  1. ELIMINANDO TODAS LAS ASIGNACIONES...')
    
    // Eliminar asignaciones específicas por usuario
    const { error: deleteBrumaError } = await supabase
      .from('user_projects')
      .delete()
      .eq('user_id', brumaUserId)
    
    if (deleteBrumaError) {
      console.log('   ❌ Error eliminando asignaciones de BrumaFightwear:', deleteBrumaError.message)
    } else {
      console.log('   ✅ Asignaciones de BrumaFightwear eliminadas')
    }
    
    const { error: deleteSebastianError } = await supabase
      .from('user_projects')
      .delete()
      .eq('user_id', sebastianUserId)
    
    if (deleteSebastianError) {
      console.log('   ❌ Error eliminando asignaciones de Sebastian:', deleteSebastianError.message)
    } else {
      console.log('   ✅ Asignaciones de Sebastian eliminadas')
    }
    
    // 2. Eliminar TODOS los proyectos
    console.log('\n🗑️  2. ELIMINANDO TODOS LOS PROYECTOS...')
    
    // Eliminar el proyecto específico que vimos
    const { error: deleteProjectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', '820c116f-adaf-4609-9b97-c727e687de79')
    
    if (deleteProjectError) {
      console.log('   ❌ Error eliminando proyecto E-commerce:', deleteProjectError.message)
    } else {
      console.log('   ✅ Proyecto E-commerce eliminado')
    }
    
    // Verificar si hay otros proyectos y eliminarlos
    const { data: remainingProjects, error: remainingError } = await supabase
      .from('projects')
      .select('*')
    
    if (remainingError) {
      console.log('   ❌ Error verificando proyectos restantes:', remainingError.message)
    } else if (remainingProjects && remainingProjects.length > 0) {
      console.log(`   📦 Eliminando ${remainingProjects.length} proyectos adicionales...`)
      
      for (const project of remainingProjects) {
        const { error: delError } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id)
        
        if (delError) {
          console.log(`   ❌ Error eliminando ${project.name}:`, delError.message)
        } else {
          console.log(`   ✅ ${project.name} eliminado`)
        }
      }
    } else {
      console.log('   ✅ No hay proyectos adicionales para eliminar')
    }
    
    // 3. Verificación final
    console.log('\n🎯 3. VERIFICACIÓN FINAL...')
    
    // Verificar proyectos
    const { data: finalProjects, error: finalProjError } = await supabase
      .from('projects')
      .select('*')
    
    if (finalProjError) {
      console.log('   ❌ Error verificando proyectos:', finalProjError.message)
    } else {
      console.log(`   📦 Proyectos restantes: ${finalProjects.length}`)
      if (finalProjects.length === 0) {
        console.log('   ✅ Tabla projects está LIMPIA')
      }
    }
    
    // Verificar asignaciones
    const { data: finalAssignments, error: finalAssignError } = await supabase
      .from('user_projects')
      .select('*')
    
    if (finalAssignError) {
      console.log('   ❌ Error verificando asignaciones:', finalAssignError.message)
    } else {
      console.log(`   👥 Asignaciones restantes: ${finalAssignments.length}`)
      if (finalAssignments.length === 0) {
        console.log('   ✅ Tabla user_projects está LIMPIA')
      }
    }
    
    // Verificar qué ven los usuarios ahora
    console.log('\n👤 4. VERIFICANDO QUE LOS USUARIOS NO VEAN PROYECTOS...')
    
    for (const user of [
      { name: 'BrumaFightwear', id: brumaUserId },
      { name: 'Sebastian', id: sebastianUserId }
    ]) {
      const { data: userProjects, error: userError } = await supabase
        .rpc('get_user_projects', { user_uuid: user.id })
      
      if (userError) {
        console.log(`   ❌ Error verificando ${user.name}:`, userError.message)
      } else {
        console.log(`   👤 ${user.name}: ${userProjects.length} proyectos`)
        if (userProjects.length === 0) {
          console.log(`   ✅ ${user.name} no ve ningún proyecto`)
        } else {
          console.log(`   ⚠️  ${user.name} aún ve proyectos:`)
          userProjects.forEach(p => console.log(`      - ${p.project_name}`))
        }
      }
    }
    
    console.log('\n🎉 LIMPIEZA COMPLETADA')
    console.log('   Ahora ambos usuarios deberían ver 0 proyectos en el dashboard')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

cleanDatabase()
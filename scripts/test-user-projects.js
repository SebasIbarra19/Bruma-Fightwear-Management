// Script para verificar la función get_user_projects
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserProjects() {
  console.log('🔍 Probando función get_user_projects...\n')
  
  const brumaUserId = 'e435d7eb-a033-4bb0-b34c-2a040c5d2f36'
  const sebastianUserId = '969e5a99-0448-44a4-b0d2-135c6ed32ae4'
  
  try {
    // Probar con BrumaFightwear
    console.log('1️⃣ Probando con BrumaFightwear...')
    const { data: brumaProjects, error: brumaError } = await supabase
      .rpc('get_user_projects', { user_uuid: brumaUserId })
    
    if (brumaError) {
      console.log('❌ Error con BrumaFightwear:', brumaError.message)
    } else {
      console.log('✅ Proyectos de BrumaFightwear:', brumaProjects)
    }
    
    // Probar con Sebastian
    console.log('\n2️⃣ Probando con Sebastian...')
    const { data: sebastianProjects, error: sebastianError } = await supabase
      .rpc('get_user_projects', { user_uuid: sebastianUserId })
    
    if (sebastianError) {
      console.log('❌ Error con Sebastian:', sebastianError.message)
    } else {
      console.log('✅ Proyectos de Sebastian:', sebastianProjects)
    }
    
    // Si la función no existe, mostrar consulta alternativa
    if (brumaError && brumaError.message.includes('does not exist')) {
      console.log('\n⚠️ La función get_user_projects no existe.')
      console.log('💡 Usando consulta directa alternativa...')
      
      const { data: directQuery, error: directError } = await supabase
        .from('user_projects')
        .select(`
          *,
          projects (
            id,
            name,
            slug,
            description,
            project_type,
            logo_url,
            color_scheme
          )
        `)
        .eq('user_id', brumaUserId)
        .eq('is_active', true)
      
      if (directError) {
        console.log('❌ Error en consulta directa:', directError.message)
      } else {
        console.log('✅ Consulta directa exitosa:', directQuery)
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

testUserProjects()
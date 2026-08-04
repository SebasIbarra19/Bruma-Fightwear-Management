export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cliente: {
        Row: {
          id_cliente: number
          nombre: string
          apellido: string | null
          email: string
          telefono: string | null
          direccion: string | null
          ciudad: string | null
          activo: boolean | null
          fecha_creacion: string | null
          fecha_actualizacion: string | null
        }
        Insert: {
          id_cliente?: number
          nombre: string
          apellido?: string | null
          email: string
          telefono?: string | null
          direccion?: string | null
          ciudad?: string | null
          activo?: boolean | null
          fecha_creacion?: string | null
          fecha_actualizacion?: string | null
        }
        Update: {
          id_cliente?: number
          nombre?: string
          apellido?: string | null
          email?: string
          telefono?: string | null
          direccion?: string | null
          ciudad?: string | null
          activo?: boolean | null
          fecha_creacion?: string | null
          fecha_actualizacion?: string | null
        }
        Relationships: []
      }
      producto: {
        Row: {
          id_producto: number
          codigo: string
          nombre: string
          descripcion: string | null
          id_proveedor: number | null
          id_categoria: number | null
          id_coleccion: number | null
          activo: boolean | null
          fecha_creacion: string | null
          fecha_actualizacion: string | null
        }
        Insert: {
          id_producto?: number
          codigo: string
          nombre: string
          descripcion?: string | null
          id_proveedor?: number | null
          id_categoria?: number | null
          id_coleccion?: number | null
          activo?: boolean | null
          fecha_creacion?: string | null
          fecha_actualizacion?: string | null
        }
        Update: {
          id_producto?: number
          codigo?: string
          nombre?: string
          descripcion?: string | null
          id_proveedor?: number | null
          id_categoria?: number | null
          id_coleccion?: number | null
          activo?: boolean | null
          fecha_creacion?: string | null
          fecha_actualizacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producto_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "tipoproducto"
            referencedColumns: ["id_tipo"]
          },
          {
            foreignKeyName: "producto_id_coleccion_fkey"
            columns: ["id_coleccion"]
            isOneToOne: false
            referencedRelation: "coleccion"
            referencedColumns: ["id_coleccion"]
          },
          {
            foreignKeyName: "producto_id_proveedor_fkey"
            columns: ["id_proveedor"]
            isOneToOne: false
            referencedRelation: "proveedor"
            referencedColumns: ["id_proveedor"]
          }
        ]
      }
      productovariante: {
        Row: {
          id_variante: number
          id_producto: number
          id_color: number | null
          codigo_variante: string | null
          nombre_variante: string | null
          precio_variante: number | null
          activo: boolean | null
        }
        Insert: {
          id_variante?: number
          id_producto: number
          id_color?: number | null
          codigo_variante?: string | null
          nombre_variante?: string | null
          precio_variante?: number | null
          activo?: boolean | null
        }
        Update: {
          id_variante?: number
          id_producto?: number
          id_color?: number | null
          codigo_variante?: string | null
          nombre_variante?: string | null
          precio_variante?: number | null
          activo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "productovariante_id_color_fkey"
            columns: ["id_color"]
            isOneToOne: false
            referencedRelation: "color"
            referencedColumns: ["id_color"]
          },
          {
            foreignKeyName: "productovariante_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "producto"
            referencedColumns: ["id_producto"]
          }
        ]
      }
      productotallastock: {
        Row: {
          id_producto_talla: number
          id_variante: number
          id_talla_proveedor: number
          stock: number
          precio: number
        }
        Insert: {
          id_producto_talla?: number
          id_variante: number
          id_talla_proveedor: number
          stock?: number
          precio: number
        }
        Update: {
          id_producto_talla?: number
          id_variante?: number
          id_talla_proveedor?: number
          stock?: number
          precio?: number
        }
        Relationships: [
          {
            foreignKeyName: "productotalla_id_talla_proveedor_fkey"
            columns: ["id_talla_proveedor"]
            isOneToOne: false
            referencedRelation: "tallaproveedor"
            referencedColumns: ["id_talla_proveedor"]
          },
          {
            foreignKeyName: "productotalla_id_variante_fkey"
            columns: ["id_variante"]
            isOneToOne: false
            referencedRelation: "productovariante"
            referencedColumns: ["id_variante"]
          }
        ]
      }
      pedido: {
        Row: {
          id_pedido: number
          fecha: string | null
          id_estado: number
          id_codigo_envio: number | null
          id_cliente: number | null
          cliente_nombre: string | null
          cliente_email: string | null
          total: number | null
          notas: string | null
          id_metodo_pago: number | null
          referencia_pago: string | null
          notas_pago: string | null
          fecha_actualizacion: string | null
        }
        Insert: {
          id_pedido?: number
          fecha?: string | null
          id_estado: number
          id_codigo_envio?: number | null
          id_cliente?: number | null
          cliente_nombre?: string | null
          cliente_email?: string | null
          total?: number | null
          notas?: string | null
          id_metodo_pago?: number | null
          referencia_pago?: string | null
          notas_pago?: string | null
          fecha_actualizacion?: string | null
        }
        Update: {
          id_pedido?: number
          fecha?: string | null
          id_estado?: number
          id_codigo_envio?: number | null
          id_cliente?: number | null
          cliente_nombre?: string | null
          cliente_email?: string | null
          total?: number | null
          notas?: string | null
          id_metodo_pago?: number | null
          referencia_pago?: string | null
          notas_pago?: string | null
          fecha_actualizacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "cliente"
            referencedColumns: ["id_cliente"]
          },
          {
            foreignKeyName: "pedido_id_estado_fkey"
            columns: ["id_estado"]
            isOneToOne: false
            referencedRelation: "estado"
            referencedColumns: ["id_estado"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

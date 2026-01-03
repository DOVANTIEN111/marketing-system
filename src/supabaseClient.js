import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ugnowgeqbexhmehozvyt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbm93Z2VxYmV4aG1laG96dnl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MjgxODksImV4cCI6MjA4MzAwNDE4OX0.0J-08KEXjc7o_l8iUE87v-TmnSZgd7MoMvUgYttEV7o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

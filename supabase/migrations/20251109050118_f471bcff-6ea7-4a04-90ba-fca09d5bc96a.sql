-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE skill_category AS ENUM ('Technical', 'Soft', 'Domain', 'Language', 'Business', 'Leadership');
CREATE TYPE proficiency_level AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
CREATE TYPE data_source_type AS ENUM ('cv', 'linkedin', 'github', 'blog', 'performance_review', 'reference_letter', 'goal_document', 'other');
CREATE TYPE privacy_level AS ENUM ('private', 'organization', 'public');

-- User Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  organization_id UUID,
  privacy_default privacy_level DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations Table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization Members Table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Standardized Skill Framework
CREATE TABLE public.skill_framework (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category skill_category NOT NULL,
  description TEXT,
  parent_skill_id UUID REFERENCES public.skill_framework(id),
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Skills (Identified Skills per Person)
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill_framework(id) ON DELETE CASCADE,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  proficiency_level proficiency_level,
  is_explicit BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  evidence TEXT[],
  privacy_level privacy_level DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Data Sources (CVs, LinkedIn, GitHub, etc.)
CREATE TABLE public.data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type data_source_type NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT,
  file_path TEXT,
  raw_content TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analysis History
CREATE TABLE public.analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  overall_score INTEGER,
  skills_identified INTEGER,
  summary TEXT,
  insights JSONB,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Postings for Matching
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT,
  description TEXT,
  required_skills UUID[],
  preferred_skills UUID[],
  location TEXT,
  salary_range TEXT,
  posted_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Matches
CREATE TABLE public.job_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  matching_skills UUID[],
  missing_skills UUID[],
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Skill Gaps (Organization-wide analysis)
CREATE TABLE public.skill_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill_framework(id) ON DELETE CASCADE,
  current_count INTEGER DEFAULT 0,
  required_count INTEGER,
  gap_severity TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_framework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for Organizations
CREATE POLICY "Organization members can view their organization"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for Organization Members
CREATE POLICY "Members can view organization members"
  ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

-- RLS Policies for Skill Framework (public read)
CREATE POLICY "Anyone can view skill framework"
  ON public.skill_framework FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for User Skills
CREATE POLICY "Users can view their own skills"
  ON public.user_skills FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public skills"
  ON public.user_skills FOR SELECT
  USING (privacy_level = 'public');

CREATE POLICY "Organization members can view org skills"
  ON public.user_skills FOR SELECT
  USING (
    privacy_level = 'organization' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = user_skills.user_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own skills"
  ON public.user_skills FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Data Sources
CREATE POLICY "Users can manage their own data sources"
  ON public.data_sources FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Analysis History
CREATE POLICY "Users can view their own analysis history"
  ON public.analysis_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own analysis history"
  ON public.analysis_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Job Postings
CREATE POLICY "Authenticated users can view active jobs"
  ON public.job_postings FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can manage their posted jobs"
  ON public.job_postings FOR ALL
  USING (posted_by = auth.uid())
  WITH CHECK (posted_by = auth.uid());

-- RLS Policies for Job Matches
CREATE POLICY "Users can view their own job matches"
  ON public.job_matches FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create job matches"
  ON public.job_matches FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Skill Gaps
CREATE POLICY "Organization members can view skill gaps"
  ON public.skill_gaps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = skill_gaps.organization_id
      AND user_id = auth.uid()
    )
  );

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_gaps_updated_at
  BEFORE UPDATE ON public.skill_gaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some standardized skills into framework
INSERT INTO public.skill_framework (name, category, description, keywords) VALUES
-- Technical Skills
('React', 'Technical', 'JavaScript library for building user interfaces', ARRAY['react', 'reactjs', 'react.js', 'frontend']),
('TypeScript', 'Technical', 'Typed superset of JavaScript', ARRAY['typescript', 'ts', 'typed javascript']),
('Python', 'Technical', 'High-level programming language', ARRAY['python', 'py', 'django', 'flask']),
('JavaScript', 'Technical', 'Programming language of the web', ARRAY['javascript', 'js', 'node', 'nodejs']),
('SQL', 'Technical', 'Database query language', ARRAY['sql', 'postgresql', 'mysql', 'database']),
('Docker', 'Technical', 'Containerization platform', ARRAY['docker', 'containers', 'containerization']),
('AWS', 'Technical', 'Amazon Web Services cloud platform', ARRAY['aws', 'amazon web services', 'cloud']),
('Git', 'Technical', 'Version control system', ARRAY['git', 'github', 'gitlab', 'version control']),
('Node.js', 'Technical', 'JavaScript runtime', ARRAY['nodejs', 'node', 'backend']),
('MongoDB', 'Technical', 'NoSQL database', ARRAY['mongodb', 'mongo', 'nosql']),

-- Soft Skills
('Leadership', 'Soft', 'Ability to guide and inspire teams', ARRAY['leadership', 'team lead', 'manager', 'leading']),
('Communication', 'Soft', 'Effective verbal and written communication', ARRAY['communication', 'presenting', 'writing']),
('Problem Solving', 'Soft', 'Analytical thinking and solution finding', ARRAY['problem solving', 'analytical', 'troubleshooting']),
('Teamwork', 'Soft', 'Collaborative work with others', ARRAY['teamwork', 'collaboration', 'team player']),
('Time Management', 'Soft', 'Efficient task prioritization', ARRAY['time management', 'organization', 'prioritization']),
('Adaptability', 'Soft', 'Flexibility in changing environments', ARRAY['adaptability', 'flexible', 'agile']),
('Critical Thinking', 'Soft', 'Logical analysis and evaluation', ARRAY['critical thinking', 'analytical', 'reasoning']),
('Creativity', 'Soft', 'Innovative thinking and ideation', ARRAY['creativity', 'creative', 'innovation']),

-- Business Skills
('Project Management', 'Business', 'Planning and executing projects', ARRAY['project management', 'agile', 'scrum', 'pmp']),
('Data Analysis', 'Business', 'Interpreting and analyzing data', ARRAY['data analysis', 'analytics', 'insights']),
('Marketing', 'Business', 'Promoting products and services', ARRAY['marketing', 'digital marketing', 'seo']),
('Sales', 'Business', 'Selling products and services', ARRAY['sales', 'business development', 'selling']),
('Strategic Planning', 'Business', 'Long-term business strategy', ARRAY['strategy', 'strategic planning', 'vision']),

-- Domain Skills
('Machine Learning', 'Domain', 'AI and ML algorithms', ARRAY['machine learning', 'ml', 'ai', 'artificial intelligence']),
('DevOps', 'Domain', 'Development and operations practices', ARRAY['devops', 'ci/cd', 'automation']),
('Cybersecurity', 'Domain', 'Information security practices', ARRAY['security', 'cybersecurity', 'infosec']),
('UI/UX Design', 'Domain', 'User interface and experience design', ARRAY['ui', 'ux', 'design', 'user experience']),
('Cloud Architecture', 'Domain', 'Cloud infrastructure design', ARRAY['cloud architecture', 'cloud', 'infrastructure']);

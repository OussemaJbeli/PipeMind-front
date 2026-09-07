import type { ProviderType } from '@/types/domain'

export interface AuthField {
  key: 'token' | 'username'
  label: string
  placeholder: string
  type: 'text' | 'password'
  hint?: string
}

export interface ProviderSpec {
  key: ProviderType
  label: string
  icon: string
  color: string
  blurb: string
  /** Cloud instances have a fixed API host; self-hosted needs a URL. */
  cloud: { label: string, baseUrl: string } | null
  selfHosted: { label: string, placeholder: string } | null
  auth: AuthField[]
  /** Exactly what the token needs, and what it costs to get it wrong. */
  scopeHint: string
  tokenUrl?: string
  available: boolean
}

export const PROVIDERS: ProviderSpec[] = [
  {
    key: 'github',
    label: 'GitHub Actions',
    icon: 'i-simple-icons-github',
    color: '#E7EAF0',
    blurb: 'Monitor workflow runs from github.com or GitHub Enterprise.',
    cloud: { label: 'github.com', baseUrl: 'https://api.github.com' },
    selfHosted: { label: 'GitHub Enterprise Server', placeholder: 'https://github.company.com/api/v3' },
    auth: [{
      key: 'token',
      label: 'Personal access token',
      placeholder: 'ghp_••••••••••••••••••••',
      type: 'password',
    }],
    scopeHint: 'Needs `repo` and `workflow`. A token without `repo` can monitor pipelines but cannot retry jobs or open issues.',
    tokenUrl: 'https://github.com/settings/tokens/new?scopes=repo,workflow&description=PipeMind',
    available: true,
  },
  {
    key: 'gitlab',
    label: 'GitLab CI/CD',
    icon: 'i-simple-icons-gitlab',
    color: '#FC6D26',
    blurb: 'Monitor pipelines from gitlab.com or a self-hosted instance.',
    cloud: { label: 'gitlab.com', baseUrl: 'https://gitlab.com' },
    selfHosted: { label: 'Self-managed GitLab', placeholder: 'https://gitlab.company.com' },
    auth: [{
      key: 'token',
      label: 'Personal access token',
      placeholder: 'glpat-••••••••••••••••',
      type: 'password',
    }],
    scopeHint: 'Needs the `api` scope. Read-only `read_api` works for monitoring but cannot retry jobs.',
    tokenUrl: 'https://gitlab.com/-/user_settings/personal_access_tokens',
    available: true,
  },
  {
    key: 'jenkins',
    label: 'Jenkins',
    icon: 'i-simple-icons-jenkins',
    color: '#D33833',
    blurb: 'Jenkins has no native pipeline webhook — PipeMind gives you a Jenkinsfile snippet.',
    cloud: null,
    selfHosted: { label: 'Jenkins instance', placeholder: 'https://jenkins.company.com' },
    auth: [
      { key: 'username', label: 'Username', placeholder: 'admin', type: 'text' },
      { key: 'token', label: 'API token', placeholder: '••••••••••••••••', type: 'password' },
    ],
    scopeHint: 'Create an API token under your Jenkins user settings. Needs Overall/Read and Job/Read.',
    available: true,
  },
  {
    key: 'generic',
    label: 'Generic webhook',
    icon: 'i-lucide-webhook',
    color: '#8B93A1',
    blurb: 'Any platform can POST the PipeMind envelope. Push-only: no polling, no actions.',
    cloud: null,
    selfHosted: null,
    auth: [],
    scopeHint: 'PipeMind generates a shared secret. Send it as X-PipeMind-Token with every request.',
    available: true,
  },
]

export function providerSpec(key: ProviderType): ProviderSpec {
  return PROVIDERS.find(p => p.key === key) ?? PROVIDERS[0]!
}

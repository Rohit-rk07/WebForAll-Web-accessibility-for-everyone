import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadCard from '../UploadCard'

// Mock the tab components
vi.mock('../UploadCard/URLTab', () => ({
  default: ({ onAnalyze, colors, onError, clearError }) => (
    <div data-testid="url-tab">
      <button onClick={() => onAnalyze('test-url')}>Analyze URL</button>
      <button onClick={() => onError('test error')}>Trigger Error</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  )
}))

vi.mock('../UploadCard/FileUploadTab', () => ({
  default: ({ onAnalyze, colors }) => (
    <div data-testid="file-tab">
      <button onClick={() => onAnalyze('test-file')}>Analyze File</button>
    </div>
  )
}))

vi.mock('../UploadCard/HTMLCodeTab', () => ({
  default: ({ onAnalyze, colors }) => (
    <div data-testid="html-tab">
      <button onClick={() => onAnalyze('test-html')}>Analyze HTML</button>
    </div>
  )
}))

describe('UploadCard', () => {
  const mockOnAnalyze = vi.fn()
  const mockSetIsLoading = vi.fn()
  const mockOnError = vi.fn()
  const mockClearError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all three tabs', () => {
    render(
      <UploadCard 
        onAnalyze={mockOnAnalyze}
        setIsLoading={mockSetIsLoading}
        onError={mockOnError}
        clearError={mockClearError}
      />
    )

    expect(screen.getByText('URL')).toBeInTheDocument()
    expect(screen.getByText('Upload File')).toBeInTheDocument()
    expect(screen.getByText('HTML Code')).toBeInTheDocument()
  })

  it('should render URL tab by default', () => {
    render(
      <UploadCard 
        onAnalyze={mockOnAnalyze}
        setIsLoading={mockSetIsLoading}
        onError={mockOnError}
        clearError={mockClearError}
      />
    )

    expect(screen.getByTestId('url-tab')).toBeInTheDocument()
    expect(screen.queryByTestId('file-tab')).not.toBeInTheDocument()
    expect(screen.queryByTestId('html-tab')).not.toBeInTheDocument()
  })

  it('should handle tab changes', () => {
    render(
      <UploadCard 
        onAnalyze={mockOnAnalyze}
        setIsLoading={mockSetIsLoading}
        onError={mockOnError}
        clearError={mockClearError}
      />
    )

    const uploadTab = screen.getByText('Upload File')
    fireEvent.click(uploadTab)

    expect(screen.getByTestId('file-tab')).toBeInTheDocument()
    expect(screen.queryByTestId('url-tab')).not.toBeInTheDocument()
  })

  it('should clear error on tab change', () => {
    render(
      <UploadCard 
        onAnalyze={mockOnAnalyze}
        setIsLoading={mockSetIsLoading}
        onError={mockOnError}
        clearError={mockClearError}
      />
    )

    const uploadTab = screen.getByText('Upload File')
    fireEvent.click(uploadTab)

    expect(mockClearError).toHaveBeenCalled()
  })

  it('should call onAnalyze when URL tab triggers analysis', () => {
    render(
      <UploadCard 
        onAnalyze={mockOnAnalyze}
        setIsLoading={mockSetIsLoading}
        onError={mockOnError}
        clearError={mockClearError}
      />
    )

    const analyzeButton = screen.getByText('Analyze URL')
    fireEvent.click(analyzeButton)

    expect(mockOnAnalyze).toHaveBeenCalledWith('test-url')
  })

  it('should start on specified default tab', () => {
    render(
      <UploadCard 
        onAnalyze={mockOnAnalyze}
        defaultTab={1}
        setIsLoading={mockSetIsLoading}
        onError={mockOnError}
        clearError={mockClearError}
      />
    )

    expect(screen.getByTestId('file-tab')).toBeInTheDocument()
    expect(screen.queryByTestId('url-tab')).not.toBeInTheDocument()
  })

  it('should have proper ARIA labels on tabs', () => {
    render(
      <UploadCard 
        onAnalyze={mockOnAnalyze}
        setIsLoading={mockSetIsLoading}
        onError={mockOnError}
        clearError={mockClearError}
      />
    )

    const urlTab = screen.getByText('URL')
    expect(urlTab).toHaveAttribute('aria-label', 'Enter URL for accessibility analysis')

    const uploadTab = screen.getByText('Upload File')
    expect(uploadTab).toHaveAttribute('aria-label', 'Upload HTML file for accessibility analysis')

    const htmlTab = screen.getByText('HTML Code')
    expect(htmlTab).toHaveAttribute('aria-label', 'Paste HTML code for accessibility analysis')
  })
})
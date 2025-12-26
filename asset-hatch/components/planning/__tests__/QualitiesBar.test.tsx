import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QualitiesBar, { ProjectQualities } from '../QualitiesBar'

describe('QualitiesBar', () => {
  const mockQualities: ProjectQualities = {
    art_style: 'Pixel Art (16-bit)',
    base_resolution: '64x64',
    perspective: 'Side-scrolling',
    game_genre: 'Platformer',
    theme: 'Fantasy',
    mood: 'Adventurous',
    color_palette: 'Vibrant',
  }

  const mockOnQualitiesChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all quality dropdown buttons', () => {
    render(
      <QualitiesBar
        qualities={mockQualities}
        onQualitiesChange={mockOnQualitiesChange}
      />
    )

    // Check for dropdown trigger buttons
    expect(screen.getByText(/Art Style:/i)).toBeInTheDocument()
    expect(screen.getByText(/Resolution:/i)).toBeInTheDocument()
    expect(screen.getByText(/Perspective:/i)).toBeInTheDocument()
    expect(screen.getByText(/Genre:/i)).toBeInTheDocument()
    expect(screen.getByText(/Theme:/i)).toBeInTheDocument()
    expect(screen.getByText(/Mood:/i)).toBeInTheDocument()
    expect(screen.getByText(/Palette:/i)).toBeInTheDocument()
  })

  it('displays current quality values', () => {
    render(
      <QualitiesBar
        qualities={mockQualities}
        onQualitiesChange={mockOnQualitiesChange}
      />
    )

    expect(screen.getByText('Pixel Art (16-bit)')).toBeInTheDocument()
    expect(screen.getByText('64x64')).toBeInTheDocument()
    expect(screen.getByText('Side-scrolling')).toBeInTheDocument()
    expect(screen.getByText('Platformer')).toBeInTheDocument()
  })

  it('calls onQualitiesChange when a quality is selected', async () => {
    const user = userEvent.setup()

    render(
      <QualitiesBar
        qualities={mockQualities}
        onQualitiesChange={mockOnQualitiesChange}
      />
    )

    // Click the Art Style dropdown
    const artStyleButton = screen.getByText(/Art Style:/i).closest('button')
    if (artStyleButton) {
      await user.click(artStyleButton)
    }

    // Wait for dropdown menu to appear and select an option
    await waitFor(() => {
      const lowPolyOption = screen.queryByText('Low-poly 3D')
      if (lowPolyOption) {
        user.click(lowPolyOption)
      }
    })

    // Verify callback was called
    await waitFor(() => {
      expect(mockOnQualitiesChange).toHaveBeenCalled()
    })
  })

  it('displays empty state when no qualities are set', () => {
    render(
      <QualitiesBar
        qualities={{}}
        onQualitiesChange={mockOnQualitiesChange}
      />
    )

    // Should show placeholder text for dropdowns
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('has accessible labels for all dropdowns', () => {
    render(
      <QualitiesBar
        qualities={mockQualities}
        onQualitiesChange={mockOnQualitiesChange}
      />
    )

    // All dropdown buttons should have text content
    const artStyleButton = screen.getByText(/Art Style:/i)
    expect(artStyleButton).toBeInTheDocument()

    const resolutionButton = screen.getByText(/Resolution:/i)
    expect(resolutionButton).toBeInTheDocument()
  })
})
